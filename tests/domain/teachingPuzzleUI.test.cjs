const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');

test('TeachingPuzzleSurface renders interaction-specific learner actions rather than a generic card shell',()=>{
  const source=fs.readFileSync(path.join(root,'components/learning/TeachingPuzzleSurface.tsx'),'utf8');
  for(const token of ['ContrastPuzzle','RelationPuzzle','TransformationPuzzle','ChunkPuzzle','EvidencePuzzle','ReformulationPuzzle'])assert.match(source,new RegExp(token));
  for(const event of ['CONTRAST_SELECTED','RELATION_ATTEMPTED','STEP_REVEALED','TRANSFORMATION_RECONSTRUCTED','CHUNK_PARTNER_SELECTED','EVIDENCE_SELECTED','REFORMULATION_SELECTED'])assert.match(source,new RegExp(event));
  assert.match(source,/現在換你重建/);assert.doesNotMatch(source,/deriveTeachingOptionsV1|decideNextTeachingPuzzleMoveV1|preferredMechanismIds|rankMechanismSuitabilityV1/);
});

test('TeachingPuzzleSurface keeps mobile touch targets and does not expose support/debug taxonomy to learner copy',()=>{
  const source=fs.readFileSync(path.join(root,'components/learning/TeachingPuzzleSurface.tsx'),'utf8');
  assert.match(source,/minimumTouchTarget/);
  assert.doesNotMatch(source,/>[^<{]*(MODELED|EXPLICIT|GUIDED|CUED|LIGHT|EXPOSURE_ONLY|mechanismId|targetRef)[^<]*<\/Text>/);
});
