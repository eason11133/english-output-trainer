import type { WritingSourceContextV1 } from './types';

const clean=(value:string)=>value.trim();
const unique=(values:readonly string[])=>[...new Set(values.map(clean).filter(Boolean))];

export function validateWritingSourceContextV1(value:WritingSourceContextV1):readonly string[]{
  const errors:string[]=[];
  if(!clean(value.promptArtifactId))errors.push('promptArtifactId required');
  if(!clean(value.promptText))errors.push('promptText required');
  if(!clean(value.purpose))errors.push('purpose required');
  if(!clean(value.audience))errors.push('audience required');
  if(!clean(value.genre))errors.push('genre required');
  if(value.timeLimitMinutes!==undefined&&value.timeLimitMinutes<=0)errors.push('timeLimitMinutes must be positive');
  const w=value.wordGuidance;
  if(w){
    for(const [key,n] of Object.entries(w))if(n!==undefined&&n<0)errors.push(`${key} must be nonnegative`);
    if(w.minimum!==undefined&&w.maximum!==undefined&&w.minimum>w.maximum)errors.push('wordGuidance minimum exceeds maximum');
  }
  if(value.sourceType==='GENERATED_FALLBACK'&&value.learnerConfirmed)errors.push('generated fallback prompt cannot masquerade as learner-confirmed authentic source');
  return errors;
}

export function createWritingSourceContextV1(input:WritingSourceContextV1):WritingSourceContextV1{
  const value:WritingSourceContextV1={
    ...input,
    promptArtifactId:clean(input.promptArtifactId),
    promptText:input.promptText,
    purpose:clean(input.purpose),
    audience:clean(input.audience),
    genre:clean(input.genre),
    taskRequirements:unique(input.taskRequirements),
    rubricRefs:unique(input.rubricRefs),
    formatConstraints:unique(input.formatConstraints),
  };
  const errors=validateWritingSourceContextV1(value);
  if(errors.length)throw new Error(`invalid_writing_source_context:${errors.join('|')}`);
  return Object.freeze(value);
}
