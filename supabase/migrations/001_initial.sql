-- English Output Trainer — validation schema v0.1
-- Run in Supabase SQL Editor after creating the project.

create extension if not exists pgcrypto;

create type public.exercise_kind as enum ('translation', 'retrieval', 'mini_output', 'essay');
create type public.knowledge_stage as enum (
  'new',
  'recognized',
  'guided_output',
  'independent_output',
  'controlled_production',
  'spontaneous_production',
  'transferred',
  'mastered'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.error_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  category text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.user_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  error_type_id uuid not null references public.error_types(id) on delete cascade,
  count integer not null default 1 check (count >= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  mastery_score numeric(5,2) not null default 0,
  unique (user_id, error_type_id)
);

create table public.learning_items (
  id uuid primary key default gen_random_uuid(),
  item_type text not null check (item_type in ('word', 'chunk', 'pattern', 'grammar')),
  canonical_text text not null,
  trigger_zh text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.user_knowledge (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  learning_item_id uuid not null references public.learning_items(id) on delete cascade,
  stage public.knowledge_stage not null default 'new',
  independent_successes integer not null default 0,
  guided_successes integer not null default 0,
  failures integer not null default 0,
  last_attempt_at timestamptz,
  next_review_at timestamptz,
  unique (user_id, learning_item_id)
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  estimated_minutes integer,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, workout_date)
);

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  kind public.exercise_kind not null,
  position integer not null,
  prompt text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (workout_id, position)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  answer text not null,
  hints_used integer not null default 0 check (hints_used >= 0),
  score numeric(6,3),
  grader_version text,
  grading_payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null check (assessment_type in ('diagnostic', 'checkpoint', 'post_test')),
  submitted_text text,
  score_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.user_errors enable row level security;
alter table public.user_knowledge enable row level security;
alter table public.workouts enable row level security;
alter table public.exercises enable row level security;
alter table public.attempts enable row level security;
alter table public.assessments enable row level security;

create policy "profiles_own" on public.profiles
for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "user_errors_own" on public.user_errors
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "user_knowledge_own" on public.user_knowledge
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "workouts_own" on public.workouts
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "exercises_via_workout" on public.exercises
for select to authenticated using (
  exists (
    select 1 from public.workouts w
    where w.id = exercises.workout_id and w.user_id = (select auth.uid())
  )
);

create policy "attempts_own" on public.attempts
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "assessments_own" on public.assessments
for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Seed only globally reusable taxonomy. Never store API secrets here.
insert into public.error_types (code, title, category, description) values
  ('G001_PLURAL_AFTER_MANY', 'Plural noun after many', 'grammar', 'many + plural countable noun'),
  ('G002_WANT_TO_INFINITIVE', 'Infinitive after want', 'grammar', 'want to + base verb'),
  ('G003_MODAL_BASE_VERB', 'Modal + base verb', 'grammar', 'modal + base verb'),
  ('G004_PREPOSITION_CLOSE_TO', 'Preposition after close', 'grammar', 'close to, not close with'),
  ('C001_GAIN_ATTENTION', 'Collocation: gain attention', 'collocation', 'Prefer gain attention in target contexts')
on conflict (code) do nothing;
