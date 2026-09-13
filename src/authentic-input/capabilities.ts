export const authenticInputCapabilityIdsV1=['Q.typing','Q.paste','Q.writing-artifact','Q.translation-prompt','Q.school-material','Q.teacher-material','Q.image-intake','Q.pdf-intake','Q.artifact-normalization','Q.future-capture-boundary'] as const;
export type AuthenticInputCapabilityIdV1=typeof authenticInputCapabilityIdsV1[number];
export type AuthenticInputCapabilityStateV1='FIRST_PASS'|'CONTRACT_ONLY'|'FUTURE';
export interface AuthenticInputCapabilityStatusV1{capabilityId:AuthenticInputCapabilityIdV1;status:AuthenticInputCapabilityStateV1;effect:string;limit:string}
const s=(capabilityId:AuthenticInputCapabilityIdV1,status:AuthenticInputCapabilityStateV1,effect:string,limit:string):AuthenticInputCapabilityStatusV1=>Object.freeze({capabilityId,status,effect,limit});
export const authenticInputCapabilityStatusV1:readonly AuthenticInputCapabilityStatusV1[]=Object.freeze([
 s('Q.typing','FIRST_PASS','Direct learner work, prompt/rubric and translation source can be normalized into an immutable authentic-input bundle.','Physical keyboard/IME acceptance remains outside Q.'),
 s('Q.paste','FIRST_PASS','Pasted authentic learner work follows the same provenance-safe normalization path.','Clipboard source ownership is not inferred automatically.'),
 s('Q.writing-artifact','FIRST_PASS','Writing prompt/rubric/learner work remain separate material roles.','Purpose/audience/genre interpretation belongs to H.'),
 s('Q.translation-prompt','FIRST_PASS','Chinese source meaning and learner English remain separate truth objects.','Meaning-fidelity judgment belongs to I/K.'),
 s('Q.school-material','CONTRACT_ONLY','Source-kind contract can represent school-owned material without pretending unknown material is school-owned.','Current intake UI does not yet ask learner to identify ownership/source kind.'),
 s('Q.teacher-material','CONTRACT_ONLY','Teacher-owned material has an explicit provenance state.','Current intake UI does not yet collect teacher-source metadata.'),
 s('Q.image-intake','FIRST_PASS','Existing camera/gallery OCR spans normalize through Q and preserve review-required uncertainty.','OCR quality/provider behavior remains T/V and device acceptance remains.'),
 s('Q.pdf-intake','FIRST_PASS','Existing PDF intake can normalize prompt/work roles and preserve immutable durable artifact pages.','Complex multi-page/rotated layout acceptance remains.'),
 s('Q.artifact-normalization','FIRST_PASS','Q emits one bounded role-separated bundle and fails closed on decision-relevant OCR uncertainty.','Dedicated normalized persistence projection beyond Stage4 runtime is not yet required.'),
 s('Q.future-capture-boundary','FUTURE','Cross-app/global Capture remains explicitly outside the current V1 intake surface.','Future ecosystem scope by product decision.')
]);
export function authenticInputWaveSummaryV1(){return Object.freeze({firstPass:authenticInputCapabilityStatusV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:authenticInputCapabilityStatusV1.filter(x=>x.status==='CONTRACT_ONLY').length,future:authenticInputCapabilityStatusV1.filter(x=>x.status==='FUTURE').length,total:authenticInputCapabilityStatusV1.length})}
