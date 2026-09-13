import { productTaskForFamilyV1, validatedProductTasksV1, validateProductTaskCandidateV1, v24ProductTaskCandidatesV1 } from '../content';
import { universalLookupSurfaceCoverageV1 } from '../lookup';

export const readyToLearnFamiliesV28=Object.freeze(['VOCABULARY_USAGE','PHRASES_COLLOCATIONS','GRAMMAR','READING','TRANSLATION','WRITING','CLOZE','CONTEXTUAL_FILL','DISCOURSE','MIXED'] as const);
export const readyToLearnProductionTracesV28=Object.freeze([
  {id:'TODAY_DIRECT',route:'/(tabs) -> /daily-lesson?origin=TODAY&systemTask=...',teacher:'semantic assessment -> diagnosis -> E/F mechanism -> learner action -> fresh attempt -> Result'},
  {id:'PRACTICE_DIRECT',route:'/(tabs)/practice -> validated systemTask -> /daily-lesson or /reading-attempt',teacher:'same canonical runtime/evidence path'},
  {id:'MY_ENGLISH_DIRECT',route:'/(tabs)/my-english -> scoped Practice -> validated systemTask',teacher:'same canonical runtime/evidence path'},
  {id:'OPTIONAL_IMPORT',route:'Practice -> Bring my own work -> /daily-lesson?origin=IMPORTED_WORK',teacher:'Q normalization -> semantic assessment -> C/K'},
]);
export function readyToLearnGateV28(){
  const missing=readyToLearnFamiliesV28.filter(family=>!productTaskForFamilyV1(family));
  const badMixed=v24ProductTaskCandidatesV1.find(item=>item.id==='V24-MIX-002');
  const badMixedResult=badMixed?validateProductTaskCandidateV1(badMixed):undefined;
  const lookupMissing=Object.entries(universalLookupSurfaceCoverageV1).filter(([,entry])=>!entry.productionConsumer||!entry.sharedPrimitive).map(([surface])=>surface);
  return Object.freeze({passed:missing.length===0&&badMixedResult?.accepted===false&&!lookupMissing.length,validatedTaskCount:validatedProductTasksV1.length,missingFamilies:Object.freeze(missing),badMixedRejected:badMixedResult?.accepted===false,badMixedReasons:badMixedResult?.reasons??Object.freeze([]),lookupMissing:Object.freeze(lookupMissing),founderAccepted:false,terminalStatus:'R6_READY_FOR_FOUNDER_RETEST' as const});
}
