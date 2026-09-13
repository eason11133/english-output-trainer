const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const source=relative=>fs.readFileSync(path.join(root,relative),'utf8');

test('Result frontstage contains qualitative next-step projection and no evidence counters',()=>{
  const result=source('app/result.tsx');
  assert.doesNotMatch(result,/vm\.(independent|assisted)|次不靠提示|次是在協助下|不能主張能力/);
  assert.match(result,/vm\.nextStep/);
  assert.match(result,/帶回原本作品/);
});

test('My English frontstage contains learner examples and no learner-truth counters',()=>{
  const myEnglish=source('app/(tabs)/my-english.tsx');
  assert.doesNotMatch(myEnglish,/vm\.summary|evidenceCount|能力點|mastery|retention|transfer|independent|assisted/);
  assert.match(myEnglish,/vm\.recentLearnerEnglish/);
  assert.match(myEnglish,/vm\.practiceAgain/);
  assert.match(myEnglish,/vm\.progressNarrative/);
});
