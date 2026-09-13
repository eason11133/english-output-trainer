import { createOriginalArtifactV4, decisionRelevantUncertaintyV4 } from '../application/stage4/learnerRuntimeV4';
import type { ArtifactModeV4, ArtifactSpanV4, IntakeSourceV4, OriginalArtifactV4 } from '../domain/stage4/LearnerRuntimeV4';
import type { AuthenticInputBundleV1, AuthenticMaterialPartV1, AuthenticMaterialSourceKindV1, NormalizeAuthenticInputV1 } from './types';

const clean=(value?:string)=>value?.trim()||undefined;
const joinRegion=(spans:readonly ArtifactSpanV4[],region:ArtifactSpanV4['region'])=>spans.filter(span=>span.region===region).map(span=>span.text.trim()).filter(Boolean).join('\n').trim();
const confidenceFor=(spans:readonly ArtifactSpanV4[]):AuthenticMaterialPartV1['confidence']=>spans.some(x=>x.confidence==='LOW')?'LOW':spans.some(x=>x.confidence==='MEDIUM')?'MEDIUM':'HIGH';
const part=(role:AuthenticMaterialPartV1['role'],text:string,provenance:AuthenticMaterialPartV1['provenance'],confidence:AuthenticMaterialPartV1['confidence'],spanIds:readonly string[]=[],teachingEligible=true):AuthenticMaterialPartV1=>Object.freeze({role,text,provenance,confidence,spanIds:Object.freeze([...spanIds]),teachingEligible});

export function createAuthenticOriginalArtifactV1(input:{id:string;learnerId:string;source:IntakeSourceV4;mode:ArtifactModeV4;pages:OriginalArtifactV4['pages'];submittedAt:string;translationSourceText?:string}):OriginalArtifactV4{
  return createOriginalArtifactV4({id:input.id,learnerId:input.learnerId,source:input.source,mode:input.mode,pages:input.pages,chineseSource:clean(input.translationSourceText),submittedAt:input.submittedAt});
}

export function normalizeAuthenticInputV1(input:NormalizeAuthenticInputV1):AuthenticInputBundleV1{
  if(!input.artifact.immutable)throw new Error('authentic_input_requires_immutable_original');
  const spans=[...input.spans];
  const learnerSpans=spans.filter(span=>span.region==='LEARNER_WRITING');
  const promptSpans=spans.filter(span=>span.region==='PRINTED_PROMPT');
  const annotationSpans=spans.filter(span=>span.region==='TEACHER_ANNOTATION');
  const unknownSpans=spans.filter(span=>span.region==='UNKNOWN');
  const directCaptureWithoutClassifier=spans.length===0&&['PASTE','DIRECT_TEXT'].includes(input.artifact.source);
  const rawPageText=input.artifact.pages.map(page=>page.originalText??'').join('\n').trim();
  const learnerWorkText=(learnerSpans.length?learnerSpans.map(x=>x.text).join('\n'):directCaptureWithoutClassifier?rawPageText:'').trim();
  if(!learnerWorkText){
    if(annotationSpans.length||unknownSpans.length||spans.length)throw new Error('authentic_input_requires_confirmed_learner_work');
    throw new Error('authentic_input_requires_learner_work');
  }
  const directPrompt=clean(input.directPromptText),ocrPrompt=clean(joinRegion(spans,'PRINTED_PROMPT'));
  const promptText=directPrompt??ocrPrompt;
  const rubricText=clean(input.directRubricText);
  const translationSourceText=clean(input.directTranslationSourceText)??clean(input.artifact.chineseSource);
  if(input.artifact.mode==='TRANSLATION'&&!translationSourceText)throw new Error('translation_requires_source_meaning');
  const uncertainties=decisionRelevantUncertaintyV4(spans);
  const quarantined=[...annotationSpans,...unknownSpans];
  const parts:AuthenticMaterialPartV1[]=[];
  if(promptText)parts.push(part('PROMPT',promptText,directPrompt?'DIRECT_USER_INPUT':uncertainties.some(x=>x.region==='PRINTED_PROMPT')?'OCR_UNCONFIRMED':'OCR_CONFIRMED',directPrompt?'HIGH':confidenceFor(promptSpans),directPrompt?[]:promptSpans.map(x=>x.id)));
  if(rubricText)parts.push(part('RUBRIC',rubricText,'DIRECT_USER_INPUT','HIGH'));
  if(translationSourceText)parts.push(part('TRANSLATION_SOURCE',translationSourceText,input.directTranslationSourceText?'DIRECT_USER_INPUT':'ARTIFACT_FIELD','HIGH'));
  parts.push(part('LEARNER_WORK',learnerWorkText,learnerSpans.length?(uncertainties.some(x=>x.region==='LEARNER_WRITING')?'OCR_UNCONFIRMED':'OCR_CONFIRMED'):'ARTIFACT_FIELD',learnerSpans.length?confidenceFor(learnerSpans):'HIGH',learnerSpans.map(x=>x.id)));
  if(annotationSpans.length)parts.push(part('TEACHER_ANNOTATION',joinRegion(annotationSpans,'TEACHER_ANNOTATION'),'OCR_CONFIRMED',confidenceFor(annotationSpans),annotationSpans.map(x=>x.id),false));
  if(unknownSpans.length)parts.push(part('UNKNOWN_REGION',joinRegion(unknownSpans,'UNKNOWN'),unknownSpans.some(x=>x.confidence==='LOW')?'OCR_UNCONFIRMED':'OCR_CONFIRMED',confidenceFor(unknownSpans),unknownSpans.map(x=>x.id),false));
  return Object.freeze({schemaVersion:1,artifact:input.artifact,mode:input.artifact.mode,captureMethod:input.artifact.source,sourceKind:input.sourceKind??'UNKNOWN',parts:Object.freeze(parts),learnerWorkText,promptText,rubricText,translationSourceText,decisionRelevantUncertaintySpanIds:Object.freeze(uncertainties.map(x=>x.id)),quarantinedSpanIds:Object.freeze(quarantined.map(x=>x.id)),integrity:uncertainties.length?'REVIEW_REQUIRED':'READY',immutableOriginal:true,capabilityEvidenceAllowed:false});
}

export function authenticInputReadyForTeachingV1(bundle:AuthenticInputBundleV1){return bundle.integrity==='READY'&&bundle.decisionRelevantUncertaintySpanIds.length===0&&Boolean(bundle.learnerWorkText.trim())}
export function authenticInputPartV1(bundle:AuthenticInputBundleV1,role:AuthenticMaterialPartV1['role']){return bundle.parts.find(item=>item.role===role)}
export function authenticSourceKindV1(value?:AuthenticMaterialSourceKindV1){return value??'UNKNOWN'}
