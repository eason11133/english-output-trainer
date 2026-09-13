import { qualifySemanticAssessmentV1, type BoundedSemanticJudgmentV1, type SemanticAssessmentDecisionV1 } from '../../assessment/semanticAssessment';
import { productionOutcomeEvaluatorsV1 } from '../../teacher-runtime/outcomeEvaluator';
import { evaluateV35SemanticUnitV1 } from './examV35SemanticRubricAuthority';

type SemanticUnitV1={unitId:string;responseKey:string;canonicalTargetRef:string;canonicalFacet:string;evaluatorKind:'EXACT_KEY'|'SEMANTIC_RUBRIC'};
type ExamSemanticTaskV1={task_id:string;family:string;subtype:string;payload:Record<string,unknown>;answer_or_rubric?:unknown;validation?:{canonical?:string};canonicalBinding?:{units:readonly SemanticUnitV1[]};semanticRubricRef?:string};
export interface ExamSemanticAssessmentBatchV1{
  decisionsByUnitId:Readonly<Record<string,SemanticAssessmentDecisionV1>>;
  outcomesByUnitId:Readonly<Record<string,SemanticAssessmentDecisionV1['outcome']>>;
  evidenceAuthorityByUnitId:Readonly<Record<string,{candidateEvidenceAllowed:boolean;negativeEvidenceAllowed:boolean}>>;
  reasonCodes:readonly string[];
}

type TranslationMeaningRubricV1={id:string;groups:readonly {dimension:string;patterns:readonly RegExp[]}[]};
const TRANSLATION_RUBRICS:Readonly<Record<string,TranslationMeaningRubricV1>>=Object.freeze({
  '學生應該善用每天零碎的時間，因為這樣比較不容易半途放棄。':{
    id:'trans-use-fragmented-time-persist-v1',groups:[
      {dimension:'learner_actor_and_advice',patterns:[/\b(?:students?|learners?|they)\b/i,/\b(?:should|ought\s+to|need\s+to|are\s+supposed\s+to)\b/i]},
      {dimension:'make_good_use_of_fragmented_daily_time',patterns:[/(?:make\s+(?:good|the\s+best|full)\s+use\s+of|take\s+advantage\s+of|use)\b.{0,48}\b(?:spare|free|short|small|little|bits?\s+of|periods?\s+of)?\s*(?:time|minutes?|moments?)\b/i,/(?:every|each)\s+day|daily/i]},
      {dimension:'reduced_risk_of_giving_up',patterns:[/(?:\b(?:less\s+likely|unlikely|not\s+as\s+likely|not\s+easily|harder)\b.{0,30}\b(?:give\s+up|quit|stop)|\b(?:keep\s+(?:going|studying)|persist|persever)\b)/i]},
    ]
  },
  '學生應該善用每天零碎的時間，因為這能讓準備過程更有效率。':{
    id:'trans-use-fragmented-time-efficiency-v1',groups:[
      {dimension:'learner_actor_and_advice',patterns:[/\b(?:students?|learners?|they)\b/i,/\b(?:should|ought\s+to|need\s+to|are\s+supposed\s+to)\b/i]},
      {dimension:'make_good_use_of_fragmented_daily_time',patterns:[/(?:make\s+(?:good|the\s+best|full)\s+use\s+of|take\s+advantage\s+of|use)\b.{0,48}\b(?:spare|free|short|small|little|bits?\s+of|periods?\s+of)?\s*(?:time|minutes?|moments?)\b/i,/(?:every|each)\s+day|daily/i]},
      {dimension:'more_efficient_preparation',patterns:[/(?:\b(?:prepare|preparation|study|studying|review|revision)\b.{0,36}\b(?:efficient|effectiv)|\b(?:more\s+efficiently|improve\w*\s+(?:their\s+)?(?:preparation|study|efficiency)))/i]},
    ]
  },
  '這項研究顯示，規律複習比考前一次讀完更有效。':{
    id:'trans-regular-review-more-effective-v1',groups:[
      {dimension:'study_finding',patterns:[/\b(?:study|research)\b/i,/\b(?:shows?|indicates?|suggests?|found)\b/i]},
      {dimension:'regular_review',patterns:[/\b(?:regular|regularly|consistent|consistently)\b.{0,24}\b(?:review|revision|study|revise)\w*\b/i]},
      {dimension:'comparison_and_cramming',patterns:[/\b(?:more\s+effective|works?\s+better|better)\b.{0,40}\b(?:than|compared\s+with|compared\s+to)\b/i,/\b(?:all\s+at\s+once|cram\w*|one\s+time|single\s+session)\b.{0,40}\b(?:exam|test)|\b(?:before|right\s+before)\b.{0,18}\b(?:exam|test)\b/i]},
    ]
  },
  '這個活動不但減少浪費，也讓居民學會如何修理日常用品。':{
    id:'trans-not-only-reduce-waste-repair-v1',groups:[
      {dimension:'activity_actor',patterns:[/\b(?:activity|event|program|programme)\b/i]},
      {dimension:'reduce_waste',patterns:[/\b(?:reduce|cut|decrease|lower)\w*\b.{0,22}\bwaste\b/i]},
      {dimension:'residents_learn_repair',patterns:[/\b(?:residents?|people|community members?)\b/i,/\b(?:learn|learned|learnt|teach|taught)\w*\b.{0,30}\b(?:repair|fix)\w*\b/i,/\b(?:everyday|daily|household)\b.{0,18}\b(?:items?|objects?|things?)\b/i]},
    ]
  },
  '當同一種解釋沒有幫助時，老師應該換一種呈現方式，而不是只換句話說。':{
    id:'trans-change-representation-not-rephrase-v1',groups:[
      {dimension:'same_explanation_not_helpful',patterns:[/\b(?:same|one)\b.{0,18}\bexplanation\b/i,/\b(?:does(?:n't| not)|did(?:n't| not)|isn't|is not)\b.{0,22}\b(?:help|work|effective)|\b(?:fails?|failed)\b/i]},
      {dimension:'teacher_changes_representation',patterns:[/\bteachers?\b/i,/\b(?:change|switch|use|try)\w*\b.{0,30}\b(?:representation|approach|method|way|format)\b/i]},
      {dimension:'not_merely_rephrase',patterns:[/\b(?:rather\s+than|instead\s+of|not\s+just|not\s+merely)\b.{0,36}\b(?:rephrase|reword|say|word)\w*\b/i]},
    ]
  },
});

const words=(text:string)=>text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g)??[];
const sentences=(text:string)=>text.split(/[.!?]+/).map(value=>value.trim()).filter(Boolean);
const paragraphs=(text:string)=>text.split(/\n\s*\n/).map(value=>value.trim()).filter(Boolean);
const finiteVerb=/\b(?:am|is|are|was|were|be|been|being|have|has|had|do|does|did|can|could|may|might|must|shall|should|will|would|shows?|indicates?|suggests?|finds?|found|helps?|makes?|uses?|learns?|reduces?|allows?|improves?|works?|prepares?|reviews?|studies|gives?|keeps?|needs?|wants?|thinks?|believes?|[a-z]+ed)\b/i;
/** Conservative local firewall. It qualifies realization; it does not decide semantic correctness. */
export function openEnglishResponseIntegrityV1(response:string):{qualified:boolean;reasonCodes:readonly string[]}{
  const tokens=words(response),clauses=sentences(response);
  if(tokens.length<4)return{qualified:false,reasonCodes:['OPEN_RESPONSE_TOO_SHORT']};
  const normalized=tokens.map(x=>x.toLowerCase()),unique=new Set(normalized);
  if(unique.size/normalized.length<0.45)return{qualified:false,reasonCodes:['OPEN_RESPONSE_REPETITIVE_TOKEN_SOUP']};
  const realized=clauses.filter(clause=>{
    const ws=words(clause);if(ws.length<3||!finiteVerb.test(clause))return false;
    if(/\b(?:can|could|may|might|must|should|will|would)\s+(?:if|because|than|and|or)\b/i.test(clause))return false;
    return /\b(?:i|we|you|he|she|it|they|students?|learners?|people|residents?|teachers?|study|research|activity|event|program|programme|review|practice|ai|technology|habit|habits)\b/i.test(clause);
  }).length;
  if(!clauses.length||realized/clauses.length<0.75)return{qualified:false,reasonCodes:['ENGLISH_REALIZATION_NOT_SAFELY_QUALIFIED']};
  return{qualified:true,reasonCodes:['ENGLISH_REALIZATION_QUALIFIED']};
}
const judgment=(outcome:BoundedSemanticJudgmentV1['outcome'],rubricId:string,dimensions:BoundedSemanticJudgmentV1['dimensions'],reasonCodes:readonly string[]):BoundedSemanticJudgmentV1=>({outcome,dimensions,rubricId,rubricVersion:'1.0.0',reasonCodes});
const qualify=(rubric:BoundedSemanticJudgmentV1,taskValidated=true)=>qualifySemanticAssessmentV1({rubric,taskValidated,contentValidated:true,supportIntegrityValid:true});
const abstain=(rubricId:string,reason:string)=>qualify(judgment('AMBIGUOUS',rubricId,[],[reason]));

function translationAssessment(source:string,response:string):SemanticAssessmentDecisionV1{
  const rubric=TRANSLATION_RUBRICS[source];
  if(!rubric)return abstain('exam-translation-bounded-v1','TRANSLATION_SOURCE_NOT_IN_BETA_BOUNDED_RUBRIC');
  if(words(response).length<3)return abstain(rubric.id,'TRANSLATION_RESPONSE_INSUFFICIENT_FOR_SEMANTIC_JUDGMENT');
  const dimensions=rubric.groups.map(group=>{
    const hits=group.patterns.filter(pattern=>pattern.test(response)).length;
    return {dimension:group.dimension,outcome:hits===group.patterns.length?'CORRECT' as const:hits>0?'PARTIALLY_CORRECT' as const:'UNRESOLVED' as const,reasonCodes:[hits===group.patterns.length?'REQUIRED_MEANING_PRESENT':hits>0?'MEANING_PARTIALLY_PRESENT':'MEANING_NOT_SAFELY_RESOLVED']};
  });
  const correct=dimensions.filter(item=>item.outcome==='CORRECT').length,partial=dimensions.filter(item=>item.outcome==='PARTIALLY_CORRECT').length;
  if(correct===dimensions.length)return qualify(judgment('CORRECT',rubric.id,dimensions,['ALL_REQUIRED_MEANING_GROUPS_PRESENT','VALID_ALTERNATIVES_ALLOWED']));
  if(correct+partial>=Math.max(2,dimensions.length-1))return qualify(judgment('PARTIALLY_CORRECT',rubric.id,dimensions,['MOST_REQUIRED_MEANING_PRESENT','FRESH_REPAIR_NEEDED']));
  return qualify(judgment('AMBIGUOUS',rubric.id,dimensions,['BOUNDED_RUBRIC_CANNOT_SAFELY_DISTINGUISH_WRONG_FROM_VALID_ALTERNATIVE']));
}

type WritingRequirementV1={dimension:string;patterns:readonly RegExp[]};
const WRITING_REQUIREMENTS:Readonly<Record<string,readonly WritingRequirementV1[]>>=Object.freeze({
  'WRITE-G-M06':[
    {dimension:'ai_student_laziness_topic',patterns:[/\bAI\b|artificial intelligence/i,/\b(?:student|students|learner|learners)\b/i]},
    {dimension:'position',patterns:[/\b(?:think|believe|agree|disagree|can|may|might|depends?|should|shouldn't|will|won't)\b/i]},
    {dimension:'condition',patterns:[/\b(?:if|unless|when|only\s+if|as\s+long\s+as|depends?\s+on)\b/i]},
  ],
  'WRITE-G-M09':[
    {dimension:'checking_answers_after_mistakes',patterns:[/\b(?:mistake|mistakes|wrong|error|errors)\b/i,/\b(?:answer|answers|solution|solutions|check|checking|look)\b/i]},
    {dimension:'benefit',patterns:[/\b(?:benefit|advantage|help|helps|useful|good|learn|understand|correct)\w*\b/i]},
    {dimension:'risk',patterns:[/\b(?:risk|disadvantage|problem|harm|bad|depend|dependency|memorize|copy|without thinking|too quickly)\w*\b/i]},
  ],
  'WRITE-G-P01':[
    {dimension:'small_habit_vs_large_effort_topic',patterns:[/\b(?:habit|habits|routine|routines|small steps?|little\s+(?:effort|practice)|consistent|consistency|regular)\b/i,/\b(?:effort|cram|cramming|intensive|large amount|all at once)\b/i]},
    {dimension:'comparative_claim',patterns:[/\b(?:more\s+effective|better|works?\s+better|because|than)\b/i]},
    {dimension:'example_or_mechanism',patterns:[/\b(?:for\s+example|for\s+instance|because|so\s+that|this\s+helps?|which\s+helps?|as\s+a\s+result)\b/i]},
  ],
});
function fallbackPhoneRequirements():readonly WritingRequirementV1[]{return[
  {dimension:'phone_school_topic',patterns:[/\b(?:phone|phones|smartphone|smartphones|mobile|device|devices)\b/i,/\b(?:class|classes|classroom|school|lesson|lessons|study|learning)\b/i]},
  {dimension:'position_or_response_move',patterns:[/\b(?:should|shouldn't|should\s+not|must|need\s+to|allow|allowed|ban|banned|limit|limited|restrict|restricted|support|oppose|think|believe|agree|disagree)\b/i]},
]}
function writingPurposeAssessment(task:ExamSemanticTaskV1,response:string):SemanticAssessmentDecisionV1{
  const rubricId=`writing-task-requirement-bounded-v1:${task.task_id}`,tokenCount=words(response).length;if(tokenCount<4)return abstain(rubricId,'WRITING_RESPONSE_INSUFFICIENT_FOR_TASK_FULFILLMENT_JUDGMENT');
  const requirements=WRITING_REQUIREMENTS[task.task_id]??fallbackPhoneRequirements(),minimum=Number(task.payload.minimumWords??0),minimumMet=!minimum||tokenCount>=minimum;
  const dims=requirements.map(req=>{const hits=req.patterns.filter(pattern=>pattern.test(response)).length;return{dimension:req.dimension,outcome:hits===req.patterns.length?'CORRECT' as const:hits>0?'PARTIALLY_CORRECT' as const:'UNRESOLVED' as const,reasonCodes:[hits===req.patterns.length?'TASK_REQUIREMENT_VISIBLE':hits>0?'TASK_REQUIREMENT_PARTIALLY_VISIBLE':'TASK_REQUIREMENT_NOT_SAFELY_RESOLVED']}});
  if(minimum)dims.push({dimension:'minimum_word_requirement',outcome:minimumMet?'CORRECT' as const:'PARTIALLY_CORRECT' as const,reasonCodes:[minimumMet?'MINIMUM_REQUIREMENT_MET':'MINIMUM_WORD_REQUIREMENT_NOT_MET']});
  const correct=dims.filter(x=>x.outcome==='CORRECT').length,partial=dims.filter(x=>x.outcome==='PARTIALLY_CORRECT').length;
  if(correct===dims.length)return qualify(judgment('CORRECT',rubricId,dims,['BOUNDED_TASK_REQUIREMENTS_MET']));
  if(correct+partial>=Math.max(1,dims.length-1))return qualify(judgment('PARTIALLY_CORRECT',rubricId,dims,['TASK_RESPONSE_PRESENT_BUT_REQUIREMENT_GAP_REMAINS']));
  return qualify(judgment('AMBIGUOUS',rubricId,dims,['OFF_TOPIC_VS_VALID_ALTERNATIVE_CANNOT_BE_SAFELY_RESOLVED']));
}
function writingIdeaAssessment(response:string):SemanticAssessmentDecisionV1{
  const rubricId='writing-idea-development-bounded-v1',tokenCount=words(response).length;if(tokenCount<5)return abstain(rubricId,'WRITING_RESPONSE_TOO_SHORT_FOR_IDEA_DEVELOPMENT');
  const development=/\b(?:because|since|therefore|thus|so\s+that|for\s+example|for\s+instance|such\s+as|as\s+a\s+result|this\s+means|which\s+(?:can|may|helps?)|leads?\s+to|results?\s+in|if|unless|when|as\s+long\s+as)\b/i.test(response),sentenceCount=sentences(response).length;
  const dims=[{dimension:'claim_or_position',outcome:sentenceCount>=1?'CORRECT' as const:'UNRESOLVED' as const,reasonCodes:['CLAIM_MATERIAL_PRESENT']},{dimension:'reason_example_or_mechanism',outcome:development?'CORRECT' as const:sentenceCount>=2?'PARTIALLY_CORRECT' as const:'UNRESOLVED' as const,reasonCodes:[development?'DEVELOPMENT_MOVE_VISIBLE':sentenceCount>=2?'MULTIPLE_SENTENCES_WITHOUT_CLEAR_DEVELOPMENT_MOVE':'DEVELOPMENT_NOT_SAFELY_RESOLVED']}];
  if(development&&tokenCount>=10)return qualify(judgment('CORRECT',rubricId,dims,['CLAIM_TO_DEVELOPMENT_MOVE_PRESENT']));
  if(sentenceCount>=2||tokenCount>=12)return qualify(judgment('PARTIALLY_CORRECT',rubricId,dims,['IDEA_PRESENT_BUT_DEVELOPMENT_THIN']));
  return qualify(judgment('AMBIGUOUS',rubricId,dims,['IDEA_DEVELOPMENT_NOT_SAFELY_RESOLVED']));
}
function writingOrganizationAssessment(task:ExamSemanticTaskV1,response:string):SemanticAssessmentDecisionV1{
  const rubricId='writing-organization-cohesion-bounded-v1',sentenceCount=sentences(response).length,paragraphCount=paragraphs(response).length,mode=String(task.payload.mode??''),connective=/\b(?:first|second|also|however|therefore|for\s+example|in\s+addition|as\s+a\s+result|finally|overall|because|although|while)\b/i.test(response),requiresTwoParagraphs=mode==='FULL';
  if(sentenceCount<2)return abstain(rubricId,'WRITING_RESPONSE_TOO_SHORT_FOR_ORGANIZATION_JUDGMENT');
  const dims=[{dimension:'sequence_and_cohesion',outcome:connective?'CORRECT' as const:sentenceCount>=3?'PARTIALLY_CORRECT' as const:'UNRESOLVED' as const,reasonCodes:[connective?'COHESIVE_MOVE_VISIBLE':'COHESION_NOT_EXPLICIT']},{dimension:'required_structure',outcome:!requiresTwoParagraphs||paragraphCount>=2?'CORRECT' as const:'PARTIALLY_CORRECT' as const,reasonCodes:[!requiresTwoParagraphs||paragraphCount>=2?'REQUIRED_STRUCTURE_PRESENT':'TWO_PARAGRAPH_REQUIREMENT_NOT_MET']}];
  if((!requiresTwoParagraphs||paragraphCount>=2)&&connective&&sentenceCount>=3)return qualify(judgment('CORRECT',rubricId,dims,['ORGANIZATION_REQUIREMENTS_VISIBLE']));
  return qualify(judgment('PARTIALLY_CORRECT',rubricId,dims,['ORGANIZATION_PRESENT_BUT_NOT_FULLY_DEMONSTRATED']));
}
function sentenceRealizationAssessment(targetRef:string,facet:string,response:string):SemanticAssessmentDecisionV1{
  const evaluated=productionOutcomeEvaluatorsV1.evaluate({targetRef,facet,response,context:'SOURCE',arena:'WRITING',taskValidated:true,contentValidated:true,supportIntegrityValid:true});
  return evaluated.semanticAssessment;
}
function mixedShortResponseAssessment(task:ExamSemanticTaskV1,responseKey:string,response:string):SemanticAssessmentDecisionV1{
  const rubricId=`mixed-short-response-bounded-v1:${task.task_id}:${responseKey}`;if(words(response).length<3)return abstain(rubricId,'MIXED_RESPONSE_INSUFFICIENT_FOR_SEMANTIC_JUDGMENT');
  const text=response.toLowerCase();let checks:readonly {dimension:string;ok:boolean}[]=[];
  if(task.task_id==='MIX-001')checks=[{dimension:'submit',ok:/\bsubmit\w*|hand\s+in|turn\s+in\b/i.test(response)},{dimension:'three_sentence_reflection',ok:/\bthree|3\b/i.test(response)&&/\b(?:sentence|reflection|write|writing)\w*\b/i.test(response)}];
  else if(task.task_id==='MIX-G-001')checks=[{dimension:'bicycle',ok:/\b(?:bicycle|bike|bikes|bicycles)\b/i.test(response)},{dimension:'replacement_bus',ok:/\b(?:replacement\s+bus|bus)\b/i.test(response)},{dimension:'cannot_carry',ok:/\b(?:cannot|can't|not\s+allowed|unable|won't)\b.{0,24}\b(?:carry\w*|carried|take\w*|bring\w*)\b|\b(?:carry\w*|carried|take\w*|bring\w*)\b.{0,24}\b(?:cannot|can't|not\s+allowed)\b/i.test(response)}];
  else if(task.task_id==='MIX-G-002')checks=[{dimension:'58',ok:/\b58\b/.test(response)},{dimension:'interested_nonmembers',ok:/\binterested\b/i.test(response)&&/\b(?:non[- ]?members?|not\s+(?:yet\s+)?members?|not\s+(?:yet\s+)?participating)\b/i.test(response)},{dimension:'largest_or_most',ok:/\b(?:largest|highest|most|greatest)\b/i.test(response)}];
  else if(task.task_id==='MIX-G-004'){const limitation=/\b(?:did\s+not|didn't|wasn't|were not|not)\b.{0,28}\b(?:measure|record|track|check|include)\w*/i.test(response)||/\b(?:unknown|unclear)\b/i.test(response),subject=/\b(?:hungry|hunger|extra\s+food|food\s+elsewhere|bought\s+food|buy\s+food)\b/i.test(response);checks=[{dimension:'unmeasured_limitation',ok:limitation},{dimension:'limitation_subject',ok:subject}]}
  else return abstain(rubricId,'MIXED_TASK_NOT_IN_BETA_BOUNDED_RUBRIC');
  const dims=checks.map(item=>({dimension:item.dimension,outcome:item.ok?'CORRECT' as const:'UNRESOLVED' as const,reasonCodes:[item.ok?'REQUIRED_MEANING_PRESENT':'REQUIRED_MEANING_NOT_SAFELY_RESOLVED']})),correct=checks.filter(x=>x.ok).length;
  if(correct===checks.length)return qualify(judgment('CORRECT',rubricId,dims,['MIXED_REQUIRED_MEANING_PRESENT','VALID_ALTERNATIVES_ALLOWED']));
  if(correct>=Math.max(1,checks.length-1))return qualify(judgment('PARTIALLY_CORRECT',rubricId,dims,['MIXED_REQUIRED_MEANING_PARTIAL']));
  return qualify(judgment('AMBIGUOUS',rubricId,dims,['MIXED_BOUNDED_RUBRIC_CANNOT_SAFELY_SCORE']));
}
function assessUnit(task:ExamSemanticTaskV1,unit:SemanticUnitV1,response:string):SemanticAssessmentDecisionV1{
  if(task.validation?.canonical!=='PASS')return abstain('exam-semantic-task-validity-v1','EXAM_TASK_NOT_CANONICALLY_VALIDATED');
  const compiled=evaluateV35SemanticUnitV1(task,unit,response);if(compiled)return qualify(compiled);
  let decision:SemanticAssessmentDecisionV1;
  if(task.family==='TRANSLATION'){
    const sources=Array.isArray(task.payload.chineseSentences)?task.payload.chineseSentences.map(String):[];
    const index=Math.max(0,Number(unit.responseKey));decision=translationAssessment(sources[index]??'',response);
  }
  else if(task.family==='MIXED')decision=mixedShortResponseAssessment(task,unit.responseKey,response);
  else if(unit.canonicalTargetRef==='writing.sentence-realization')decision=sentenceRealizationAssessment(unit.canonicalTargetRef,unit.canonicalFacet,response);
  else if(unit.canonicalTargetRef==='writing.purpose-audience')decision=writingPurposeAssessment(task,response);
  else if(unit.canonicalTargetRef==='writing.idea-reasoning')decision=writingIdeaAssessment(response);
  else if(unit.canonicalTargetRef==='writing.organization-cohesion')decision=writingOrganizationAssessment(task,response);
  else return abstain('exam-semantic-unhandled-v1','NO_BOUNDED_SEMANTIC_RUBRIC_FOR_CANONICAL_UNIT');
  if(decision.outcome==='CORRECT'&&decision.candidateEvidenceAllowed){
    const integrity=openEnglishResponseIntegrityV1(response);
    if(!integrity.qualified)return Object.freeze({...decision,learnerEvidenceConfidence:'NONE',candidateEvidenceAllowed:false,negativeEvidenceAllowed:false,consumeEvidenceOpportunity:false,abstained:true,reasonCodes:Object.freeze([...decision.reasonCodes,...integrity.reasonCodes,'SEMANTIC_DIAGNOSIS_RETAINED_WITHOUT_POSITIVE_EVIDENCE'])});
  }
  return decision;
}

export function assessExamSemanticUnitsV1(input:{task:ExamSemanticTaskV1;response:Readonly<Record<string,string>>}):ExamSemanticAssessmentBatchV1{
  const decisions:Record<string,SemanticAssessmentDecisionV1>={},outcomes:Record<string,SemanticAssessmentDecisionV1['outcome']>={},authority:Record<string,{candidateEvidenceAllowed:boolean;negativeEvidenceAllowed:boolean}>={},reasons:string[]=[];
  for(const unit of input.task.canonicalBinding?.units??[]){
    if(unit.evaluatorKind!=='SEMANTIC_RUBRIC')continue;
    const decision=assessUnit(input.task,unit,input.response[unit.responseKey]??'');
    decisions[unit.unitId]=decision;outcomes[unit.unitId]=decision.outcome;authority[unit.unitId]={candidateEvidenceAllowed:decision.candidateEvidenceAllowed,negativeEvidenceAllowed:decision.negativeEvidenceAllowed};reasons.push(...decision.reasonCodes.map(code=>`${unit.unitId}:${code}`));
  }
  return Object.freeze({decisionsByUnitId:Object.freeze(decisions),outcomesByUnitId:Object.freeze(outcomes),evidenceAuthorityByUnitId:Object.freeze(authority),reasonCodes:Object.freeze(reasons)});
}
