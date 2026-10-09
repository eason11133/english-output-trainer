const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');

test('production Teacher runtime no longer imports or executes the fixed five-step composition helpers',()=>{
  const source=fs.readFileSync(path.join(root,'src/teacher-runtime/runtime.ts'),'utf8');
  for(const token of ['composeTeacherPlanV1','advanceTeacherCompositionV1','recomposeTeacherPlanV1','compositionCursor','teacherComposition'])assert.equal(source.includes(token),false,token);
  assert.match(source,/decideNextTeachingPuzzleMoveV1/);
  assert.match(source,/teachingPuzzleComposerState/);
  assert.match(source,/teachingPuzzleSelection/);
});

test('production lesson binds and renders a Teacher-selected puzzle instead of letting UI choose pedagogy',()=>{
  const lesson=fs.readFileSync(path.join(root,'app/daily-lesson.tsx'),'utf8');
  assert.match(lesson,/bindSelectedTeachingPuzzleContentV1/);
  assert.match(lesson,/projectTeachingPuzzleExperienceV1/);
  assert.match(lesson,/TeachingPuzzleSurface/);
  assert.match(lesson,/parseTeachingPuzzleSelectionV1\(decision\.configuration\.teachingPuzzleSelection\)/);
  assert.doesNotMatch(lesson,/TeachingPuzzleSurface[^\n]*decideNextTeachingPuzzleMoveV1/);
});

test('undeliverable puzzle content is not persisted as if that puzzle had been shown',()=>{
  const lesson=fs.readFileSync(path.join(root,'app/daily-lesson.tsx'),'utf8');
  for(const key of ['teachingPuzzleComposerState:_composerState','teachingPuzzleSelection:_selection','teachingPuzzleId:_puzzleId'])assert.match(lesson,new RegExp(key));
  assert.match(lesson,/teachingPuzzleBindingStatus:'UNAVAILABLE'/);
});

test('puzzle micro-interactions are recorded without advancing the Teacher before a meaningful completion or impasse',()=>{
  const lesson=fs.readFileSync(path.join(root,'app/daily-lesson.tsx'),'utf8');
  assert.match(lesson,/puzzleInteractionOnly/);
  for(const event of ['ITEM_MOVED','ITEM_REORDERED','OPTION_SELECTED','TEXT_ENTERED','SUPPORT_REVEALED'])assert.match(lesson,new RegExp(event));
  assert.match(lesson,/onComplete=\{\(\)=>void handleEvent\('BLOCK_COMPLETED'/);
  assert.match(lesson,/onStuck=\{\(\)=>void handleEvent\('IMPASSE_REPLAN_REQUESTED'/);
});

test('teaching puzzle completion remains exposure-only before later learner practice',()=>{
  const adapter=fs.readFileSync(path.join(root,'src/teacher-runtime/eventAdapter.ts'),'utf8');
  assert.match(adapter,/BLOCK_COMPLETED'&&input\.role==='TEACH'\)\{kind='LEARNER_RESPONSE';outcome='EXPOSURE_ONLY'/);
  const runtime=fs.readFileSync(path.join(root,'src/teacher-runtime/runtime.ts'),'utf8');
  assert.match(runtime,/HANDOFF_TO_PRACTICE/);
  assert.match(runtime,/evidenceToObserve:\[\]/);
});
