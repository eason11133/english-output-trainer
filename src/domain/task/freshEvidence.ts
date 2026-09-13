import type { CapabilityFacet } from '../english/EnglishDomain';
import type { EvidenceCeilingV1,FreshEvidenceOpportunityV1,FreshTaskLoadProfileV1,FreshTaskValidationGateV1,FreshnessRelationshipV1 } from './TaskContract';

const normalize=(value:string)=>value.trim().replace(/\s+/g,' ').toLowerCase();
const tokens=(value:string)=>new Set(normalize(value).match(/[a-z\u3400-\u9fff]+/g)??[]);
const overlap=(a:string,b:string)=>{const left=tokens(a),right=tokens(b);if(!left.size||!right.size)return 0;let shared=0;for(const token of left)if(right.has(token))shared++;return shared/Math.min(left.size,right.size)};
const hash=(value:string)=>{let h=0x811c9dc5;for(const ch of normalize(value)){h^=ch.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0}return`fnv1a32:${h.toString(16).padStart(8,'0')}`};
const gates:readonly FreshTaskValidationGateV1[]=['G1_TARGET_IDENTITY','G2_NO_HIDDEN_TARGET','G3_VALID_ANSWER_OR_RUBRIC','G4_DISTRACTOR_CAUSALITY','G5_FRESHNESS_LEVEL','G6_SUPPORT_FIREWALL','G7_DIFFICULTY_ANCHOR','G8_CURRENT_EXAM_FORMAT','G9_PROVENANCE_AND_LICENSE','G10_PREUSE_VALIDATION'];
const ceiling=(relationship:FreshnessRelationshipV1):EvidenceCeilingV1=>relationship==='F0_EXACT_REPLAY'?'PRACTICE_ONLY':relationship==='F1_SURFACE_CLONE'?'ASSISTED_OBSERVATION':relationship==='F2_STRUCTURAL_PARALLEL'?'FRESH_INDEPENDENT':relationship==='F3_CONTEXT_DIVERSE_EQUIVALENT'?'CHANGED_CONTEXT_TRANSFER':relationship==='F4_AUTHENTIC_REDEPLOYMENT'?'AUTHENTIC_TRANSFER':'DELAYED_RETENTION';
export const unknownFreshTaskLoadV1=():FreshTaskLoadProfileV1=>Object.freeze({lexical:'UNKNOWN',syntactic:'UNKNOWN',reasoning:'UNKNOWN',contextDiversity:'UNKNOWN',responseGeneration:'UNKNOWN',distractorCompetition:'UNKNOWN',evidenceDistance:'UNKNOWN',timePressure:'UNKNOWN'});

export function classifyFreshnessRelationshipV1(input:{sourceId:string;itemId:string;sourceText:string;itemText:string;sourceTemplateGeometry:string;itemTemplateGeometry:string;sourceSolutionGeometry:string;itemSolutionGeometry:string;sourceContext:string;itemContext:string;sourceGenre:string;itemGenre:string;authenticRedeployment?:boolean;delayedChangedContext?:boolean}):{relationship:FreshnessRelationshipV1;reasons:readonly string[];lexicalOverlap:number}{
  const lexicalOverlap=overlap(input.sourceText,input.itemText),sameContent=hash(input.sourceText)===hash(input.itemText),sameGeometry=input.sourceTemplateGeometry===input.itemTemplateGeometry&&input.sourceSolutionGeometry===input.itemSolutionGeometry,sameContext=input.sourceContext===input.itemContext&&input.sourceGenre===input.itemGenre;
  if(input.delayedChangedContext)return{relationship:'F5_DELAYED_CHANGED_CONTEXT',reasons:Object.freeze(['actual delay and changed context declared by Phase F delivery']),lexicalOverlap};
  if(input.authenticRedeployment)return{relationship:'F4_AUTHENTIC_REDEPLOYMENT',reasons:Object.freeze(['learner-originated use in a new authentic artifact']),lexicalOverlap};
  if(input.sourceId===input.itemId||sameContent)return{relationship:'F0_EXACT_REPLAY',reasons:Object.freeze(['same item identity or normalized content fingerprint']),lexicalOverlap};
  if(sameGeometry&&(lexicalOverlap>=0.65||sameContext))return{relationship:'F1_SURFACE_CLONE',reasons:Object.freeze(['same template and solution geometry with only surface variation']),lexicalOverlap};
  if(sameContext||input.sourceGenre===input.itemGenre)return{relationship:'F2_STRUCTURAL_PARALLEL',reasons:Object.freeze(['new content under a controlled parallel representation']),lexicalOverlap};
  return{relationship:'F3_CONTEXT_DIVERSE_EQUIVALENT',reasons:Object.freeze(['materially changed context or representation']),lexicalOverlap};
}

export function buildFreshEvidenceOpportunityV1(input:{relationship:FreshnessRelationshipV1;comparedSourceId:string;comparedItemId:string;sourceText:string;itemText:string;templateGeometry:string;solutionGeometry:string;targetRef:string;facet:CapabilityFacet;senseId?:string;topicContext:string;genreRepresentation:string;constructionCueOverlap?:number;distractorStructure?:string;load?:FreshTaskLoadProfileV1;validatorRefs:readonly string[];gateFailures?:Partial<Record<FreshTaskValidationGateV1,string>>;acceptedAnswerRule:'UNIQUE_KEY'|'EXPLICIT_ALTERNATIVES'|'SEMANTIC_RUBRIC';provenanceStatus:'KNOWN_ALLOWED'|'KNOWN_RESTRICTED'|'UNKNOWN';examFormatStatus:'CURRENT_EQUIVALENT'|'HISTORICAL_ONLY'|'NOT_EXAM'|'UNKNOWN'}):FreshEvidenceOpportunityV1{
  const failures=input.gateFailures??{},validation={} as Record<FreshTaskValidationGateV1,'PASS'|'FAIL'|'NOT_APPLICABLE'>,reasons:string[]=[];
  for(const gate of gates){const reason=failures[gate];validation[gate]=reason?'FAIL':gate==='G4_DISTRACTOR_CAUSALITY'&&input.distractorStructure==='NOT_APPLICABLE'?'NOT_APPLICABLE':'PASS';if(reason)reasons.push(`${gate}:${reason}`)}
  if(input.relationship==='F0_EXACT_REPLAY')reasons.push('F0_EXACT_REPLAY_CANNOT_PROVE_FRESHNESS');
  if(input.relationship==='F1_SURFACE_CLONE')reasons.push('F1_SURFACE_CLONE_CANNOT_PROVE_TRANSFER');
  const preuseValidated=reasons.length===0&&input.validatorRefs.length>0&&input.provenanceStatus==='KNOWN_ALLOWED'&&input.examFormatStatus!=='HISTORICAL_ONLY'&&input.examFormatStatus!=='UNKNOWN';
  validation.G10_PREUSE_VALIDATION=preuseValidated?'PASS':'FAIL';
  if(!preuseValidated&&!reasons.some(x=>x.startsWith('G10_')))reasons.push('G10_PREUSE_VALIDATION:opportunity did not pass every required pre-use guard');
  const target=Object.freeze({targetRef:input.targetRef,facet:input.facet,...(input.senseId?{senseId:input.senseId}:{})});
  return Object.freeze({relationship:input.relationship,comparedSourceId:input.comparedSourceId,comparedItemId:input.comparedItemId,sourceFingerprint:hash(input.sourceText),itemFingerprint:hash(input.itemText),templateGeometry:input.templateGeometry,solutionGeometry:input.solutionGeometry,target,topicContext:input.topicContext,genreRepresentation:input.genreRepresentation,lexicalOverlap:overlap(input.sourceText,input.itemText),constructionCueOverlap:input.constructionCueOverlap??0,distractorStructure:input.distractorStructure??'NOT_APPLICABLE',load:input.load??unknownFreshTaskLoadV1(),validation:Object.freeze(validation),validationRefs:Object.freeze([...input.validatorRefs]),invalidationReasons:Object.freeze(reasons),allowedEvidenceCeiling:preuseValidated?ceiling(input.relationship):'PRACTICE_ONLY',acceptedAnswerRule:input.acceptedAnswerRule,provenanceStatus:input.provenanceStatus,examFormatStatus:input.examFormatStatus,preuseValidated});
}

export function validateFreshEvidenceOpportunityV1(opportunity:FreshEvidenceOpportunityV1|undefined,claim:{targetRef:string;facet:CapabilityFacet;senseId?:string}){
  const reasons:string[]=[];if(!opportunity)return{valid:false,reasons:Object.freeze(['FRESH_EVIDENCE_OPPORTUNITY_MISSING'])};
  if(!opportunity.preuseValidated)reasons.push(...opportunity.invalidationReasons);
  if(opportunity.target.targetRef!==claim.targetRef||opportunity.target.facet!==claim.facet||(opportunity.target.senseId??'')!==(claim.senseId??''))reasons.push('G1_EXACT_TARGET_FACET_SENSE_MISMATCH');
  for(const [gate,status] of Object.entries(opportunity.validation))if(status==='FAIL')reasons.push(`${gate}_FAILED`);
  return{valid:reasons.length===0,reasons:Object.freeze([...new Set(reasons)])};
}
