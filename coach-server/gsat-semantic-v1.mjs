import { randomUUID } from 'node:crypto';

export const GSAT_SEMANTIC_PROMPT_VERSION='gsat-semantic-scoring-v1';
export const GSAT_SEMANTIC_SCHEMA_VERSION='semantic-assessment-v1';
const OUTCOMES=['CORRECT','PARTIALLY_CORRECT','INCORRECT','AMBIGUOUS','UNINTERPRETABLE'];
const DIMENSION_OUTCOMES=['CORRECT','PARTIALLY_CORRECT','INCORRECT','UNRESOLVED'];

const outputText=response=>response.output_text??response.output?.flatMap(item=>item.content||[]).find(item=>item.type==='output_text')?.text;
const dimensionIds=unit=>unit.family==='TRANSLATION'
  ? [...unit.meaningUnits.map(x=>x.id),...unit.relationConstraints.map((_,i)=>`RELATION_${i+1}`),'TARGET_RETRIEVAL','LANGUAGE_CONTROL']
  : Object.entries(unit.writing.dimensions).filter(([,v])=>v.evaluate).map(([id])=>id);

function resultSchema(units){return{type:'object',additionalProperties:false,required:['results'],properties:{results:{type:'array',minItems:units.length,maxItems:units.length,items:{type:'object',additionalProperties:false,required:['unitId','outcome','dimensions','reasonCodes'],properties:{unitId:{enum:units.map(x=>x.unitId)},outcome:{enum:OUTCOMES},dimensions:{type:'array',items:{type:'object',additionalProperties:false,required:['dimension','outcome','reasonCodes'],properties:{dimension:{enum:[...new Set(units.flatMap(dimensionIds))]},outcome:{enum:DIMENSION_OUTCOMES},reasonCodes:{type:'array',items:{type:'string'},maxItems:4}}}},reasonCodes:{type:'array',items:{type:'string'},maxItems:6}}}}}}}

function instructions(family){
  const common='Return only the required JSON. Evaluate only the supplied promoted GSAT task rubric and learner-authored response. This is a bounded scoring proposal, never mastery, diagnosis, or learner-truth authority. Do not require reference wording. Do not infer omitted rubric requirements. Irrelevant, empty, prompt-copy, or uninterpretable input is UNINTERPRETABLE or INCORRECT as the rubric warrants.';
  if(family==='TRANSLATION')return `${common} For GSAT Chinese-to-English translation, score every required meaning unit and relation constraint. Preserve negation, modality, degree, comparison, time, agency, and causal strength when declared. Natural paraphrases are valid. Keep semantic coverage distinct from LANGUAGE_CONTROL. TARGET_RETRIEVAL means the intended source concept was independently retrieved into English; a semantically related but wrong target sense is not retrieval success.`;
  return `${common} For GSAT English writing, use only enabled task-specific dimensions: task fulfillment, organization, idea development, coherence, language control, and voice preservation. Enforce supplied minimum word, sentence, paragraph, and structural requirements. Multiple valid positions, ideas, voices, and organizations must remain possible. Never generate a replacement essay and never treat model-written wording as learner production.`;
}

function validPacket(input){return input&&['TRANSLATION','WRITING'].includes(input.family)&&typeof input.taskId==='string'&&typeof input.taskContentHash==='string'&&typeof input.rubricHash==='string'&&Array.isArray(input.units)&&input.units.length>0&&input.units.every(unit=>typeof unit.unitId==='string'&&unit.family===input.family&&typeof unit.response==='string'&&dimensionIds(unit).length>0)}
function validateParsed(parsed,units){
  if(!parsed||!Array.isArray(parsed.results)||parsed.results.length!==units.length)return false;
  const byId=new Map(units.map(x=>[x.unitId,x]));
  return parsed.results.every(result=>{const unit=byId.get(result.unitId),allowed=new Set(unit?dimensionIds(unit):[]);return unit&&OUTCOMES.includes(result.outcome)&&Array.isArray(result.reasonCodes)&&Array.isArray(result.dimensions)&&result.dimensions.every(d=>allowed.has(d.dimension)&&DIMENSION_OUTCOMES.includes(d.outcome)&&Array.isArray(d.reasonCodes))});
}

export async function scoreGsatSemanticV1({apiKey,model,input,requestId=randomUUID(),fetchImpl=fetch,timeoutMs=60000}){
  if(!apiKey)throw new Error('missing_server_config');
  if(!validPacket(input))throw new Error('invalid_gsat_scoring_packet');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);let response,raw;
  try{
    response=await fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},signal:controller.signal,body:JSON.stringify({model,store:false,reasoning:{effort:'low'},max_output_tokens:1800,instructions:instructions(input.family),input:JSON.stringify(input),text:{format:{type:'json_schema',name:'eot_gsat_semantic_assessment_v1',strict:true,schema:resultSchema(input.units)}},metadata:{request_id:requestId,task_id:input.taskId,family:input.family,prompt_version:GSAT_SEMANTIC_PROMPT_VERSION}})});
    raw=await response.json();
    if(!response.ok)throw new Error(`provider_${response.status}:${raw?.error?.code||raw?.error?.type||'request_failed'}`);
  }finally{clearTimeout(timer)}
  const text=outputText(raw);if(!text)throw new Error('provider_empty_output');
  let parsed;try{parsed=JSON.parse(text)}catch{throw new Error('invalid_provider_json')}
  if(!validateParsed(parsed,input.units))throw new Error('invalid_gsat_semantic_schema');
  return{results:parsed.results.map(result=>({...result,rubricId:`${input.rubricHash}:${result.unitId}`,rubricVersion:input.rubricVersion,provider:'OpenAI',model,modelVersion:model,promptVersion:GSAT_SEMANTIC_PROMPT_VERSION,schemaVersion:GSAT_SEMANTIC_SCHEMA_VERSION,requestId})),telemetry:{provider:'OpenAI',model,responseId:raw.id??null,requestId,inputTokens:raw.usage?.input_tokens??0,outputTokens:raw.usage?.output_tokens??0}};
}

