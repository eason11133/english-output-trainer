import rubricsJson from '../../content/examV35SemanticRubrics.json';
import type { ExamBetaTask } from '../../content/examBetaBank';
import { qualifySemanticAssessmentV1, type SemanticAssessmentDecisionV1, type SemanticAssessmentFailureV1, type SemanticModelJudgmentV1 } from '../../assessment/semanticAssessment';
import { ProviderRequestErrorV1 } from '../../reliability';

type MeaningUnit={id:string;requirement:string;concepts:readonly {canonical:string;aliases:readonly string[]}[]};
type TranslationUnit={unitId:string;responseKey:string;meaningUnits:readonly MeaningUnit[];relationConstraints:readonly string[]};
type WritingRubric={taskOperation:string;taskRequirements:readonly {id:string;requirement:string}[];dimensions:Readonly<Record<string,{evaluate:boolean;note:string}>>;minimumWords:number;minimumParagraphs:number;minimumSentences:number;topicGroups:readonly {sourcePattern:string;aliases:readonly string[]}[];multipleValidIdeasAndStructuresAllowed:true;referenceAnswerForbidden:true;voicePreservationRequired:true};
type Rubric={taskId:string;family:'TRANSLATION'|'WRITING'|'MIXED';rubricVersion:string;taskContentHash:string;rubricHash:string;units?:readonly TranslationUnit[];writing?:WritingRubric};
type PacketUnit={unitId:string;family:'TRANSLATION';response:string;sourceText:string;meaningUnits:readonly MeaningUnit[];relationConstraints:readonly string[]}|{unitId:string;family:'WRITING';response:string;prompt:string;requirements:readonly string[];writing:WritingRubric};
export interface GsatScoringPacketV1{taskId:string;family:'TRANSLATION'|'WRITING';taskContentHash:string;rubricHash:string;rubricVersion:string;units:readonly PacketUnit[];support:{lookupExposed:boolean;learnerAuthored:boolean}}
export interface GsatScoringResponseV1{results:readonly SemanticModelJudgmentV1[];telemetry:{provider:string;model:string;responseId:string|null;requestId:string;inputTokens:number;outputTokens:number}}
export type GsatScoringRequestV1=(packet:GsatScoringPacketV1)=>Promise<GsatScoringResponseV1>;

const rubrics=(rubricsJson as unknown as{rubrics:readonly Rubric[]}).rubrics;
export const GSAT_LIVE_AI_ALLOWLIST_V1=Object.freeze([{provider:'OpenAI',model:'gpt-5.6-terra',modelVersion:'gpt-5.6-terra',schemaVersion:'semantic-assessment-v1' as const}]);
const byTask=new Map(rubrics.map(r=>[r.taskId,r]));
const sourceAt=(task:ExamBetaTask,key:string)=>{const sentences=task.payload.chineseSentences;return Array.isArray(sentences)?String(sentences[Number(key)]??sentences[0]??''):String(task.payload.sourceText??task.payload.prompt??'')};
const writingResponse=(task:ExamBetaTask,response:Readonly<Record<string,string>>)=>task.canonicalBinding?.units.map(u=>response[u.responseKey]).find(Boolean)??Object.values(response).join('\n\n');

export function compileGsatScoringPacketV1(task:ExamBetaTask,response:Readonly<Record<string,string>>,lookupExposure:readonly string[]):GsatScoringPacketV1|undefined{
  if(task.family!=='TRANSLATION'&&task.family!=='WRITING')return undefined;
  const rubric=byTask.get(task.task_id);if(!rubric||rubric.family!==task.family||rubric.taskContentHash!==String((task as{contentHash?:string}).contentHash??rubric.taskContentHash))return undefined;
  if(task.family==='TRANSLATION'){
    const units=(rubric.units??[]).map(unit=>({unitId:unit.unitId,family:'TRANSLATION' as const,response:String(response[unit.responseKey]??''),sourceText:sourceAt(task,unit.responseKey),meaningUnits:unit.meaningUnits,relationConstraints:unit.relationConstraints}));
    if(!units.length)return undefined;return{taskId:task.task_id,family:'TRANSLATION',taskContentHash:rubric.taskContentHash,rubricHash:rubric.rubricHash,rubricVersion:rubric.rubricVersion,units,support:{lookupExposed:lookupExposure.length>0,learnerAuthored:true}};
  }
  const writing=rubric.writing;if(!writing)return undefined;
  const dimensionFor=(target:string)=>target.includes('purpose-audience')?['task_fulfillment']:target.includes('idea-reasoning')?['idea_development']:target.includes('organization-cohesion')?['organization','coherence']:target.includes('sentence-realization')?['language_control']:target.includes('revision')?['voice_preservation']:Object.keys(writing.dimensions);
  const bound=task.canonicalBinding?.units.filter(u=>u.evaluatorKind==='SEMANTIC_RUBRIC')??[],units=(bound.length?bound:[{unitId:`${task.task_id}:writing`,canonicalTargetRef:'writing.purpose-audience'}]).map(unit=>{const enabled=new Set(dimensionFor(unit.canonicalTargetRef));return{unitId:unit.unitId,family:'WRITING' as const,response:writingResponse(task,response),prompt:String(task.payload.prompt??task.payload.topic??''),requirements:Array.isArray(task.payload.requirementBullets)?task.payload.requirementBullets.map(String):[],writing:{...writing,dimensions:Object.fromEntries(Object.entries(writing.dimensions).map(([id,value])=>[id,{...value,evaluate:value.evaluate&&enabled.has(id)}]))}}});
  return{taskId:task.task_id,family:'WRITING',taskContentHash:rubric.taskContentHash,rubricHash:rubric.rubricHash,rubricVersion:rubric.rubricVersion,units,support:{lookupExposed:lookupExposure.length>0,learnerAuthored:true}};
}

const failure=(error:unknown):SemanticAssessmentFailureV1=>error instanceof ProviderRequestErrorV1&&error.failure.kind==='TIMEOUT'?'PROVIDER_TIMEOUT':error instanceof ProviderRequestErrorV1&&error.failure.kind==='INVALID_RESPONSE'?'INVALID_SCHEMA':'PROVIDER_FAILURE';
export async function assessGsatSemanticLiveV1(input:{task:ExamBetaTask;response:Readonly<Record<string,string>>;lookupExposure:readonly string[];request:GsatScoringRequestV1}){
  const packet=compileGsatScoringPacketV1(input.task,input.response,input.lookupExposure),decisions:Record<string,SemanticAssessmentDecisionV1>={};
  const semanticUnits=input.task.canonicalBinding?.units.filter(u=>u.evaluatorKind==='SEMANTIC_RUBRIC')??[];
  if(!packet){for(const unit of semanticUnits)decisions[unit.unitId]=qualifySemanticAssessmentV1({modelRequired:true,providerFailure:'INVALID_CONTENT',taskValidated:false,contentValidated:false,supportIntegrityValid:false});return decisions}
  try{
    const response=await input.request(packet),allowed=GSAT_LIVE_AI_ALLOWLIST_V1;
    for(const unit of semanticUnits){const model=response.results.find(x=>x.requestId===response.telemetry.requestId&&x.rubricId===`${packet.rubricHash}:${unit.unitId}`);decisions[unit.unitId]=qualifySemanticAssessmentV1({model,modelRequired:true,taskValidated:true,contentValidated:true,supportIntegrityValid:!packet.support.lookupExposed,allowedModels:allowed})}
  }catch(error){for(const unit of semanticUnits)decisions[unit.unitId]=qualifySemanticAssessmentV1({modelRequired:true,providerFailure:failure(error),taskValidated:true,contentValidated:true,supportIntegrityValid:!packet.support.lookupExposed})}
  return decisions;
}
