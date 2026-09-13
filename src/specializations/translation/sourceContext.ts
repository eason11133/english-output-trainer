import type { TranslationSourceContextV1 } from './types';
export function createTranslationSourceContextV1(input:TranslationSourceContextV1):TranslationSourceContextV1{
  if(!input.sourceArtifactId.trim())throw new Error('translation source artifact required');
  if(!input.sourceText.trim())throw new Error('translation source text required');
  if(input.sourceType==='GENERATED_FALLBACK'&&input.learnerConfirmed)throw new Error('generated fallback source cannot masquerade as learner-confirmed authentic source');
  return Object.freeze({...input,rubricRefs:Object.freeze([...input.rubricRefs]),referenceAnswers:Object.freeze([...input.referenceAnswers])});
}
export function translationSourceFromInputV1(input:{sourceArtifactId:string;sourceText:string;productMode:'GENERAL'|'EXAM';rubricText?:string;referenceAnswers?:readonly string[];sourceType?:TranslationSourceContextV1['sourceType'];learnerConfirmed?:boolean}){
  return createTranslationSourceContextV1({sourceArtifactId:input.sourceArtifactId,sourceText:input.sourceText.trim(),sourceLanguage:'zh-TW',targetLanguage:'en',sourceType:input.sourceType??(input.productMode==='EXAM'?'EXAM':'UNSPECIFIED_AUTHENTIC'),rubricRefs:input.rubricText?.trim()?[input.rubricText.trim()]:[],referenceAnswers:Object.freeze([...(input.referenceAnswers??[])]),learnerConfirmed:input.learnerConfirmed??true});
}
