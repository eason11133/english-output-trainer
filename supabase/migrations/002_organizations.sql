-- Architecture preview for future teacher / cram-school / school workspaces.
-- No billing provider is wired yet. Seat limits are data only.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('teacher', 'cram_school', 'school')),
  seat_limit integer not null default 0 check (seat_limit >= 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'teacher', 'learner')),
  joined_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id uuid not null references public.classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);
