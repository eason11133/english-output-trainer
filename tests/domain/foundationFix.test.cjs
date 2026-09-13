const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=file=>fs.readFileSync(file,'utf8');

test('active learner routes expose visible Back and hardware Back handling',()=>{
  for(const file of ['app/daily-lesson.tsx','app/reading-attempt.tsx','app/exam-practice.tsx','app/quick-calibration.tsx']){
    const source=read(file);assert.match(source,/accessibilityLabel="返回"/);assert.match(source,/useLearnerBack/);
  }
});
test('daily exit persists learner draft and pauses without completing evidence',()=>{const source=read('app/daily-lesson.tsx');assert.match(source,/saveLearnerDraftV1\(current,textRef\.current\)/);assert.match(source,/pauseLessonSessionV1\(drafted\)/);assert.doesNotMatch(source,/exitLesson[\s\S]{0,500}closeReturnedLessonSessionV1/)});
test('daily renders its primary prompt only through OutputWorkspace',()=>{const source=read('app/daily-lesson.tsx'),active=source.slice(source.indexOf('const writingWork='),source.indexOf('function Shell'));assert.doesNotMatch(active,/promptStrip/);assert.match(active,/<OutputWorkspace/)});
test('dead invalid-input primary actions are omitted',()=>{assert.match(read('components/experience/LearnerAction.tsx'),/if\(disabled&&!loading\)return null/);assert.match(read('app/daily-lesson.tsx'),/if\(disabled\)return null/);assert.doesNotMatch(read('app/reading-attempt.tsx'),/disabled=\{!attempt\.answers/)});
test('Today and Practice refresh resumable truth on focus and suppress rapid relaunch',()=>{for(const file of ['app/(tabs)/index.tsx','app/(tabs)/practice.tsx']){const source=read(file);assert.match(source,/useFocusEffect/);assert.match(source,/launchInFlight/);}});
test('result navigation does not resurrect the completed imported artifact',()=>{const source=read('src/experience/resultNavigation.ts');assert.doesNotMatch(source,/回到這份作品/);assert.match(source,/帶入另一份作品/)});
test('My English manual capture is explicitly expandable and remains canonical',()=>{const source=read('app/(tabs)/my-english.tsx');assert.match(source,/accessibilityState=\{\{expanded:captureOpen\}\}/);assert.match(source,/<LexicalEncounterPanel/);assert.match(read('components/learning/LexicalEncounterPanel.tsx'),/canonicalLexicalEncounterStoreV1\.append/)});
