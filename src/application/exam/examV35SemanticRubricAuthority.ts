import rubricData from '../../content/examV35SemanticRubrics.json';
import { examContentHashV1 } from '../../content/examValidationReceipts';
import type { BoundedSemanticJudgmentV1, SemanticDimensionJudgmentV1 } from '../../assessment/semanticAssessment';

type SemanticTask={task_id:string;family:string;subtype:string;payload:Record<string,unknown>;answer_or_rubric?:unknown;freshness_group_id?:string;content_lineage_id?:string;provenance?:unknown;canonicalBinding?:unknown;semanticRubricRef?:string};
type SemanticUnit={unitId:string;responseKey:string;canonicalTargetRef:string;canonicalFacet:string};
type CompiledConcept={canonical:string;aliases:readonly string[]};
type CompiledMeaningUnit={id:string;requirement:string;concepts:readonly CompiledConcept[]};
type CompiledUnit={unitId:string;responseKey:string;meaningUnits:readonly CompiledMeaningUnit[];relationConstraints:readonly string[]};
type WritingRubric={taskOperation:string;taskRequirements:readonly {id:string;requirement:string}[];dimensions:Readonly<Record<string,{evaluate:boolean;note:string}>>;minimumWords:number;minimumParagraphs:number;minimumSentences:number;topicGroups:readonly {sourcePattern:string;aliases:readonly string[]}[];multipleValidIdeasAndStructuresAllowed:true;referenceAnswerForbidden:true;voicePreservationRequired:true};
type CompiledRubric={taskId:string;family:'MIXED'|'TRANSLATION'|'WRITING';rubricVersion:string;taskContentHash:string;rubricHash:string;units?:readonly CompiledUnit[];writing?:WritingRubric};
const rubrics=new Map((rubricData.rubrics as unknown as CompiledRubric[]).map(rubric=>[rubric.taskId,rubric]));
const relationAliases=rubricData.relationAliases as Readonly<Record<string,readonly string[]>>;
function hashValue(value:string){let hash=2166136261;for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619)}return`fnv1a32-${(hash>>>0).toString(16).padStart(8,'0')}`}
const words=(text:string)=>text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?|\d+/g)??[];
const stem=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/ies$/,'y').replace(/ing$/,'').replace(/ed$/,'').replace(/ly$/,'').replace(/s$/,'');
const normalized=(text:string)=>` ${words(text).join(' ')} `;
function phrasePresent(response:string,alias:string){const phrase=words(alias);if(!phrase.length)return false;const text=normalized(response);if(text.includes(` ${phrase.join(' ')} `))return true;const responseStems=new Set(words(response).map(stem));return phrase.every(token=>responseStems.has(stem(token)))}
const dimension=(name:string,outcome:SemanticDimensionJudgmentV1['outcome'],reason:string):SemanticDimensionJudgmentV1=>({dimension:name,outcome,reasonCodes:[reason]});
const judgment=(outcome:BoundedSemanticJudgmentV1['outcome'],rubric:CompiledRubric,dimensions:readonly SemanticDimensionJudgmentV1[],reasons:readonly string[]):BoundedSemanticJudgmentV1=>({outcome,dimensions,rubricId:`v35:${rubric.taskId}`,rubricVersion:rubric.rubricVersion,reasonCodes:[...reasons,`RUBRIC_HASH:${rubric.rubricHash}`]});
function authority(task:SemanticTask){const rubric=rubrics.get(task.task_id);if(!rubric||task.semanticRubricRef!==`v35-semantic:${task.task_id}:v1`||rubric.taskContentHash!==examContentHashV1(task))return undefined;const{rubricHash,...hashable}=rubric;if(hashValue(JSON.stringify(hashable))!==rubricHash)return undefined;return rubric}

function evaluateMeaning(rubric:CompiledRubric,unit:CompiledUnit,response:string){
 const dimensions=unit.meaningUnits.map(mu=>{const hits=mu.concepts.filter(concept=>concept.aliases.some(alias=>phrasePresent(response,alias))).length,required=Math.max(1,Math.ceil(mu.concepts.length*.55));return dimension(`meaning:${mu.id}`,hits>=required?'CORRECT':hits?'PARTIALLY_CORRECT':'UNRESOLVED',hits>=required?'BOUNDED_MEANING_CONCEPTS_PRESENT':hits?'BOUNDED_MEANING_PARTIAL':'BOUNDED_MEANING_NOT_RESOLVED')});
 const relations=unit.relationConstraints.map(relation=>{const present=(relationAliases[relation]??[]).some(alias=>phrasePresent(response,alias));return dimension(`relation:${relation}`,present?'CORRECT':'UNRESOLVED',present?'RELATION_CONSTRAINT_PRESERVED':'RELATION_CONSTRAINT_NOT_RESOLVED')});
 const all=[...dimensions,...relations],correct=all.filter(x=>x.outcome==='CORRECT').length,partial=all.filter(x=>x.outcome==='PARTIALLY_CORRECT').length;
 if(all.length&&correct===all.length)return judgment('CORRECT',rubric,all,['ALL_REQUIRED_MEANING_AND_RELATIONS_PRESERVED','NATURAL_PARAPHRASES_ALLOWED']);
 if(correct+partial>=Math.max(1,Math.ceil(all.length*.6)))return judgment('PARTIALLY_CORRECT',rubric,all,['REQUIRED_MEANING_PARTIAL','FORM_CONTROL_REMAINS_SEPARATE']);
 return judgment('AMBIGUOUS',rubric,all,['BOUNDED_AUTHORITY_ABSTAINS_ON_UNRESOLVED_MEANING','NO_NEGATIVE_EVIDENCE_FROM_ONE_UNRESOLVED_RESPONSE']);
}
function sentenceCount(text:string){return text.split(/[.!?]+/).filter(x=>x.trim()).length}
function paragraphCount(text:string){return text.split(/\n\s*\n/).filter(x=>x.trim()).length}
const reasonMove=(text:string)=>/\b(?:because|since|therefore|so that|as a result|reason|this helps?|which helps?)\b/i.test(text);
const exampleMove=(text:string)=>/\b(?:for example|for instance|such as|one example|when i|once)\b/i.test(text);
const positionMove=(text:string)=>/\b(?:i think|i believe|i prefer|in my opinion|should|shouldn't|should not|must|better|more important|agree|disagree)\b/i.test(text);
function writingTaskFulfillment(rubric:CompiledRubric,w:WritingRubric,response:string){
 const tokens=words(response),topic=w.topicGroups.some(group=>group.aliases.some(alias=>phrasePresent(response,alias))),requirements=w.taskRequirements.map(x=>x.requirement).join(' '),checks=[dimension('task_topic',topic?'CORRECT':'UNRESOLVED',topic?'TASK_SCOPED_TOPIC_PRESENT':'TASK_SCOPED_TOPIC_NOT_RESOLVED')];
 if(w.minimumWords)checks.push(dimension('minimum_words',tokens.length>=w.minimumWords?'CORRECT':'PARTIALLY_CORRECT',tokens.length>=w.minimumWords?'MINIMUM_WORDS_MET':'MINIMUM_WORDS_NOT_MET'));
 checks.push(dimension('minimum_structure',paragraphCount(response)>=w.minimumParagraphs&&sentenceCount(response)>=w.minimumSentences?'CORRECT':'PARTIALLY_CORRECT','TASK_SCOPED_STRUCTURE_CHECKED'));
 if(/立場|看法|選擇|回答|兩者|是否|POSITION/i.test(requirements+w.taskOperation))checks.push(dimension('position_or_choice',positionMove(response)?'CORRECT':'UNRESOLVED',positionMove(response)?'LEARNER_POSITION_PRESENT':'LEARNER_POSITION_NOT_RESOLVED'));
 if(/理由|原因|解釋|說明|分析|REASON|ANALYSIS/i.test(requirements+w.taskOperation))checks.push(dimension('reason_or_analysis',reasonMove(response)?'CORRECT':'PARTIALLY_CORRECT',reasonMove(response)?'REASONING_MOVE_PRESENT':'REASONING_MOVE_NOT_EXPLICIT'));
 if(/例|EXAMPLE/i.test(requirements+w.taskOperation))checks.push(dimension('example',exampleMove(response)?'CORRECT':'PARTIALLY_CORRECT',exampleMove(response)?'EXAMPLE_MOVE_PRESENT':'EXAMPLE_MOVE_NOT_EXPLICIT'));
 const correct=checks.filter(x=>x.outcome==='CORRECT').length;if(topic&&correct>=Math.ceil(checks.length*.7))return judgment('CORRECT',rubric,checks,['TASK_REQUIREMENTS_SATISFIED_WITHOUT_REFERENCE_ANSWER','MULTIPLE_IDEAS_AND_ORGANIZATIONS_ALLOWED','VOICE_PRESERVATION_POLICY_ACTIVE']);
 if(topic&&correct>=Math.ceil(checks.length*.4))return judgment('PARTIALLY_CORRECT',rubric,checks,['TASK_FULFILLMENT_PARTIAL','SUPPORTED_REVISION_DOES_NOT_PROVE_INDEPENDENCE']);
 return judgment('AMBIGUOUS',rubric,checks,['TASK_FULFILLMENT_NOT_SAFELY_RESOLVED']);
}
function writingDimension(rubric:CompiledRubric,unit:SemanticUnit,response:string){const w=rubric.writing!;if(unit.canonicalTargetRef==='writing.purpose-audience')return writingTaskFulfillment(rubric,w,response);if(unit.canonicalTargetRef==='writing.idea-reasoning'){const present=reasonMove(response)||exampleMove(response),dims=[dimension('idea_development',present?'CORRECT':sentenceCount(response)>=2?'PARTIALLY_CORRECT':'UNRESOLVED',present?'DEVELOPMENT_MOVE_PRESENT':'DEVELOPMENT_NOT_FULLY_RESOLVED')];return judgment(present?'CORRECT':sentenceCount(response)>=2?'PARTIALLY_CORRECT':'AMBIGUOUS',rubric,dims,['MULTIPLE_VALID_IDEAS_ALLOWED'])}if(unit.canonicalTargetRef==='writing.organization-cohesion'){const connective=/\b(?:first|second|also|however|therefore|in addition|finally|overall|because|although|while)\b/i.test(response),structure=paragraphCount(response)>=w.minimumParagraphs&&sentenceCount(response)>=w.minimumSentences,dims=[dimension('organization',connective&&structure?'CORRECT':structure?'PARTIALLY_CORRECT':'UNRESOLVED',connective&&structure?'COHERENT_STRUCTURE_PRESENT':'ORGANIZATION_PARTIAL')];return judgment(connective&&structure?'CORRECT':structure?'PARTIALLY_CORRECT':'AMBIGUOUS',rubric,dims,['NO_SINGLE_ORGANIZATION_REQUIRED'])}const realized=sentenceCount(response)>=w.minimumSentences&&words(response).length>=Math.max(8,w.minimumWords),dims=[dimension('language_control',realized?'CORRECT':'UNRESOLVED',realized?'LEARNER_SENTENCE_REALIZATION_PRESENT':'LANGUAGE_CONTROL_NOT_SAFELY_RESOLVED')];return judgment(realized?'CORRECT':'AMBIGUOUS',rubric,dims,['LEARNER_AUTHORED_LANGUAGE_REQUIRED','MODEL_WRITTEN_LANGUAGE_FORBIDDEN'])}

export function hasV35SemanticRubricAuthorityV1(task:SemanticTask){return Boolean(authority(task))}
export function evaluateV35SemanticUnitV1(task:SemanticTask,unit:SemanticUnit,response:string):BoundedSemanticJudgmentV1|undefined{const rubric=authority(task);if(!rubric)return undefined;if(rubric.family==='WRITING')return writingDimension(rubric,unit,response);const compiled=rubric.units?.find(x=>x.unitId===unit.unitId&&x.responseKey===unit.responseKey);return compiled?evaluateMeaning(rubric,compiled,response):undefined}
