import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {guardEvidenceCandidate}=require('../.domain-test-build/application/teacher/pedagogicalGuards.js');
const base=process.env.TEACHER_ACCEPTANCE_URL||'http://127.0.0.1:8787';
const source='AI will have a signigicant impact on future job. Schools should allow to use phones for learning.';
const pckUnits=[
 {id:'V05_ORTHOGRAPHIC_INSTABILITY',domain:'VOCABULARY',state:'meaning available while written form is unstable',entryMoves:['SELF_REPAIR_PROMPT','FORM_CONTRAST','RECONSTRUCT','REPRESENT_DIFFERENTLY'],doNot:['reteach meaning by default'],independentSuccess:'hidden-model full-form production'},
 {id:'V08_LEXICAL_SYNTACTIC_PATTERN',domain:'CHUNK',state:'lexical argument frame is unstable',entryMoves:['SEMANTIC_CONTRAST','DECOMPOSE','GUIDED_REVISION','ELICIT'],doNot:['teach false absolute rules'],independentSuccess:'use a legal frame for new meaning'},
];
async function request(context){const response=await fetch(`${base}/teacher/plan`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(context)});const body=await response.json();if(!response.ok)throw new Error(`${response.status}:${body.error||'teacher request failed'}`);return body}
const priorTurns=[];const trajectory=[];
async function turn(label,learnerResponse,extra={}){const context={sourceText:source,learnerResponse,ocrUnresolved:false,priorEvidence:[],priorTurns,pckUnits,...extra};const plan=await request(context);trajectory.push({label,learnerResponse,observations:plan.observations.map(x=>x.claim),positiveEvidence:plan.positiveEvidence.map(x=>x.claim),hypotheses:plan.competingHypotheses.map(x=>({id:x.id,confidence:x.confidence,explanation:x.explanation})),decision:plan.interventionDecision,action:plan.teacherAction,support:plan.supportLevel,teacherUtterance:plan.teacherUtterance});priorTurns.push({id:`live-${priorTurns.length+1}`,learnerResponse,plan,createdAt:new Date().toISOString()});return plan}

const ocrPlan=await request({sourceText:source,learnerResponse:source,ocrUnresolved:true,priorEvidence:[],priorTurns:[],pckUnits});
const initial=await turn('initial-confirmed-source',source);
const repair=await turn('independent-self-repair','AI will have a significant impact on future job. Schools should allow to use phones for learning.');
const confusion=await turn('teacher-explanation-confused',"I don't understand that explanation about allow. Who is missing?");
const visibleModel='Schools should allow students to use phones for learning.';
const copied=await turn('visible-model-copy',visibleModel,{visibleModel});
const independent=await turn('hidden-model-independent','Schools should allow learners to use tablets for research.',{visibleModel:undefined});
const returned=await turn('return-to-original','AI will have a significant impact on future jobs. Schools should allow students to use phones for learning.',{originalSourceControlled:true,contextNovelty:'SAME'});
const transfer=await turn('changed-context-transfer','This app allows users to save their work.',{originalSourceControlled:true,contextNovelty:'NEW'});

const common={learnerId:'live-learner',sessionId:'live-episode',missionUnitId:'live-turn',knowledgePointId:'allow-o-to-v',activityFamily:'MINI_OUTPUT',result:'SUCCESS',evaluationScope:'TARGET_ONLY',attemptNumber:1,selfRepairSucceeded:false,answerRevealed:false,contextId:'live-artifact',source:'SELF',confidence:'HIGH',origin:'LEARNER_PRODUCTION',timing:'IMMEDIATE',opportunityPresent:true};
const modeled=guardEvidenceCandidate({...common,responseText:visibleModel,assistance:'STRUCTURE_CUE',contextNovelty:'SAME',supportDependency:'MODELED'});
const independentEvidence=guardEvidenceCandidate({...common,missionUnitId:'live-independent',responseText:'Schools should allow learners to use tablets for research.',assistance:'NONE',contextNovelty:'SAME',supportDependency:'INDEPENDENT'});
const transferEvidence=guardEvidenceCandidate({...common,missionUnitId:'live-transfer',responseText:'This app allows users to save their work.',assistance:'NONE',contextNovelty:'NEW',supportDependency:'INDEPENDENT',metadata:{transfer:true}});
const ocrCorrection=guardEvidenceCandidate({...common,missionUnitId:'live-ocr',responseText:'signigicant',assistance:'NONE',contextNovelty:'SAME',supportDependency:'INDEPENDENT',origin:'OCR_CORRECTION'});
const guardRejections=[];
if(ocrPlan.teacherAction!=='CLARIFY_TRANSCRIPT')guardRejections.push(`ocr-action:${ocrPlan.teacherAction}`);
if(confusion.teacherAction===repair.teacherAction)guardRejections.push('strategy-did-not-change-after-confusion');
if(copied.supportLevel==='NONE')guardRejections.push('model-copy-marked-independent');
if(!modeled.accepted||modeled.event.supportDependency!=='MODELED')guardRejections.push('modeled-evidence-not-preserved');
if(!independentEvidence.accepted||independentEvidence.event.supportDependency!=='INDEPENDENT')guardRejections.push('independent-evidence-not-preserved');
if(!transferEvidence.accepted||transferEvidence.event.contextNovelty!=='NEW')guardRejections.push('transfer-evidence-not-separated');
if(ocrCorrection.accepted)guardRejections.push('ocr-correction-became-learning-evidence');
console.log(JSON.stringify({model:'gpt-5.6-terra',ocr:{decision:ocrPlan.interventionDecision,action:ocrPlan.teacherAction,uncertainty:ocrPlan.uncertainty,teacherUtterance:ocrPlan.teacherUtterance},trajectory,guards:{modeled:{accepted:modeled.accepted,support:modeled.accepted?modeled.event.supportDependency:modeled.reasons},independent:{accepted:independentEvidence.accepted,support:independentEvidence.accepted?independentEvidence.event.supportDependency:independentEvidence.reasons},transfer:{accepted:transferEvidence.accepted,contextNovelty:transferEvidence.accepted?transferEvidence.event.contextNovelty:transferEvidence.reasons},ocrCorrection:{accepted:ocrCorrection.accepted,reasons:ocrCorrection.accepted?[]:ocrCorrection.reasons}},guardRejections},null,2));
if(guardRejections.length)process.exitCode=1;
