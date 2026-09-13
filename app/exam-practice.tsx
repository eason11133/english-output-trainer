import { eotLearnerTokensV1 as woodTheme } from '../src/ui/tokens';
import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useId, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCanonicalProductData } from '../context/AppDataContext';
import { admitExamEvidenceV1 } from '../src/application/exam/examEvidenceAdmission';
import {
  createExamOperationalRuntimeV1,
  examLessonPlanForDecisionV1,
  resumableExamOperationalRuntimeV1,
  updateExamOperationalRuntimeV1,
} from '../src/application/exam/examOperationalRuntime';
import { submitExamToCanonicalTeacherV1, type CanonicalExamSubmissionResultV1 } from '../src/application/exam/examSubmissionAdapter';
import { assessExamSemanticUnitsV1 } from '../src/application/exam/examSemanticAssessment';
import {
  buildExamTeacherInteractionV1,
  continueExamTeacherAfterInteractionV1,
  type ExamTeacherInteractionV1,
} from '../src/application/exam/examTeacherInteraction';
import { examBetaTaskById, examFamilyToPracticeFamilyV1, practiceFamilyToExamFamily, type ExamAllocationPurposeV1, type ExamBetaTask } from '../src/content/examBetaBank';
import { resolveProductionExamContentV1 } from '../src/content/productionContentSupply';
import { examContentHashV1 } from '../src/content/examValidationReceipts';
import { loadExamTaskHistoryV1, recordExamTaskHistoryV1 } from '../src/persistence/examTaskHistory';
import { projectLearnerModelV3 } from '../src/application/learner/projectLearnerModelV3';
import {
  canonicalLearnerTruthV1,
  operationalHistoryReadPortV1,
  type ExamOperationalRuntimeV1,
} from '../src/persistence';
import {
  loadActiveExamOperationalCheckpointV1,
  loadExamOperationalCheckpointV1,
  persistExamEvidenceAdmissionsV1,
  persistExamTeacherLineageV1,
  saveExamOperationalCheckpointV1,
} from '../src/persistence/examOperationalPersistence';
import type { LessonPlanV1, ProductContextV1 } from '../src/architecture/contracts';
import type { QualifiedInnerTutorDecisionV1 } from '../src/teacher-runtime';
import { hasPrivateBetaPulseV1, privateBetaLocalDateV1, savePrivateBetaProductEventV1, savePrivateBetaPulseV1, savePrivateBetaWeekOneSurveyV2, shouldAskWeekOneSurveyV1, type PrivateBetaRatingV1, type PrivateBetaReturnIntentV1 } from '../src/market-validation/privateBetaPulse';
import { eotLearnerTokensV1 as t } from '../src/ui';
import { UniversalLookupText } from '../components/learning/UniversalLookupText';
import {ContextualSpotlight} from '../components/experience/ContextualSpotlight';
import {useLearnerBack} from '../components/experience/useLearnerBack';
import { requestGsatSemanticAssessment, requestQualifiedBlockDecision } from '../lib/teacherApi';
import { createExamTeacherProviderV1 } from '../src/application/exam/examTeacherProvider';
import { assessGsatSemanticLiveV1 } from '../src/application/exam/gsatLiveSemanticAssessment';
import { evaluateExamTeacherInteractionV1 } from '../src/application/exam/examInteractionEvaluator';
import type { CapabilityFacet } from '../src/domain/english/EnglishDomain';

const examTeacherProvider=createExamTeacherProviderV1(requestQualifiedBlockDecision);
const familyLabel:Record<string,string>={VOCABULARY:'詞彙',COMPREHENSIVE:'綜合測驗',CONTEXTUAL_FILL:'文意選填',DISCOURSE:'篇章結構',READING:'閱讀',MIXED:'混合題',TRANSLATION:'中譯英',WRITING:'英文作文'};

type Option = { id: string; text: string };
type Blank = { id: string; options?: Option[] };
type Question = { id: string; prompt: string; options?: Option[] };

export default function ExamPractice() {
  const params = useLocalSearchParams<{ practiceFamily?: string; amount?: string; formal?:string; calibration?:string;taskId?:string;purpose?:ExamAllocationPurposeV1;sourceSession?:string }>();
  const { learnerPreferences, runtimeProductContext,profile,updateProductContext,recordTutorialAction } = useCanonicalProductData();
  const family = practiceFamilyToExamFamily(params.practiceFamily ?? '');
  const launchKey = useId();
  const exitToPractice=()=>router.replace('/(tabs)/practice');
  const [selection, setSelection] = useState<{ taskId: string; sessionId: string; purpose:ExamAllocationPurposeV1 } | null>();
  useEffect(() => {
    let live = true;
    void (async () => {
      if (!family) { if (live) setSelection(null); return; }
      const explicit=params.taskId?examBetaTaskById(family,params.taskId):undefined;
      if(explicit){if(live)setSelection({taskId:explicit.task_id,sessionId:`exam:${explicit.task_id}:${learnerPreferences.learnerId}:${launchKey}`,purpose:params.purpose??'PRACTICE_NEW'});return}
      const active = await loadActiveExamOperationalCheckpointV1(learnerPreferences.learnerId, family);
      const resumedTask = active ? examBetaTaskById(family, active.runtime.taskId) : undefined;
      if (resumedTask&&active?.runtime.contentHash===examContentHashV1(resumedTask)) { if (live) setSelection({ taskId: resumedTask.task_id, sessionId: active!.runtime.id, purpose:'PRACTICE_NEW' }); return; }
      const history=await loadExamTaskHistoryV1(learnerPreferences.learnerId,family);
      const freshResolution=resolveProductionExamContentV1({family,learnerId:learnerPreferences.learnerId,role:'INDEPENDENT_ASSESS',variant:params.amount,rotationKey:launchKey,recent:history});
      const reviewResolution=freshResolution.status==='READY'?undefined:resolveProductionExamContentV1({family,learnerId:learnerPreferences.learnerId,role:'GUIDED_PRACTICE',variant:params.amount,rotationKey:launchKey,recent:history});
      const fresh=freshResolution.status==='READY'?freshResolution.content.task:undefined,task=fresh??(reviewResolution?.status==='READY'?reviewResolution.content.task:undefined);
      if (live) setSelection(task ? { taskId: task.task_id, sessionId: `exam:${task.task_id}:${learnerPreferences.learnerId}:${launchKey}`, purpose:fresh?'PRACTICE_NEW':'REVIEW_ONLY' } : null);
    })();
    return () => { live = false; };
  }, [family, launchKey, learnerPreferences.learnerId, params.amount,params.purpose,params.taskId]);
  const task = family && selection ? examBetaTaskById(family, selection.taskId) : undefined;
  useLearnerBack(exitToPractice,undefined,!task);
  if (selection === undefined) return <Shell onBack={exitToPractice}><Text style={styles.title}>正在接回練習…</Text></Shell>;
  if (!task || !selection) return <Shell onBack={exitToPractice}><Text style={styles.title}>目前沒有通過驗證的題目</Text><Button label="返回練習" onPress={exitToPractice} /></Shell>;
  return <ExamPracticeSession task={task} sessionId={selection.sessionId} allocationPurpose={selection.purpose} learnerId={learnerPreferences.learnerId} runtimeProductContext={runtimeProductContext} coachMarks={profile.gsatBeta.coachMarks} markCoach={name=>void updateProductContext({gsatBeta:{coachMarks:{[name]:true}}})} recordTutorialAction={async(...args)=>{if(profile.onboarding.status!=='COMPLETED'&&profile.onboarding.firstDay?.milestones.TODAY_STARTED)await recordTutorialAction(...args)}} formal={params.formal==='1'} />;
}

function ExamPracticeSession({ task, sessionId, allocationPurpose, learnerId, runtimeProductContext,coachMarks,markCoach,recordTutorialAction,formal=false }: { task: ExamBetaTask; sessionId: string; allocationPurpose:ExamAllocationPurposeV1; learnerId: string; runtimeProductContext: ProductContextV1;coachMarks:{teacher:boolean;mcq?:boolean;lookup?:boolean};markCoach:(name:'teacher'|'mcq'|'lookup')=>void;recordTutorialAction:ReturnType<typeof useCanonicalProductData>['recordTutorialAction'];formal?:boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [activeBlank, setActiveBlank] = useState('1');
  const [sourceOpen, setSourceOpen] = useState(true);
  const [done, setDone] = useState(false);
  const [teacherMessage, setTeacherMessage] = useState('');
  const [teacherDecision, setTeacherDecision] = useState<QualifiedInnerTutorDecisionV1>();
  const [interaction, setInteraction] = useState<ExamTeacherInteractionV1>();
  const [interactionText, setInteractionText] = useState('');
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resumeMessage, setResumeMessage] = useState('');
  const [pulseDone, setPulseDone] = useState(false);
  const [pulseUsefulness, setPulseUsefulness] = useState<PrivateBetaRatingV1>();
  const [pulseFriction, setPulseFriction] = useState<PrivateBetaRatingV1>();
  const [pulseReturn, setPulseReturn] = useState<PrivateBetaReturnIntentV1>();
  const [pulseNote, setPulseNote] = useState('');
  const [weekSurveyDue, setWeekSurveyDue] = useState(false);
  const [weekSurveyDone, setWeekSurveyDone] = useState(false);
  const[missMost,setMissMost]=useState('');const[difference,setDifference]=useState('');const[keepUsing,setKeepUsing]=useState<PrivateBetaReturnIntentV1>();const[recommend,setRecommend]=useState<PrivateBetaReturnIntentV1>();const[paidReaction,setPaidReaction]=useState<'WOULD_CONSIDER'|'NOT_SURE'|'FREE_ONLY'|'WOULD_NOT_USE'>();
  const [substitute, setSubstitute] = useState('');
  const [weekReason, setWeekReason] = useState('');
  const[lookupExposure,setLookupExposure]=useState<string[]>([]);
  const runtimeRef = useRef<ExamOperationalRuntimeV1 | null>(null);
  const submitInFlightRef=useRef(false);
  const exitInFlightRef=useRef(false);

  const payload = task.payload;
  const firstUnit = task.canonicalBinding?.units[0];
  const freshnessIdentity = `${allocationPurpose}:${task.freshness_group_id ?? task.task_id}:${sessionId}`;
  const assessmentSupport = allocationPurpose==='REVIEW_ONLY'?'LIGHT' as const:'NONE' as const;
  const lessonPlan: LessonPlanV1 = {
    id: `exam-plan:${sessionId}`,
    learnerId: learnerId,
    targetRef: firstUnit?.canonicalTargetRef ?? 'reading.inference',
    facet: firstUnit?.canonicalFacet ?? 'SELECTION',
    needKind: 'MAINTENANCE',
    objective: `完成 ${task.task_id} 的已綁定單元`,
    reason: 'CANONICAL_EXAM_BINDING',
    reasonCodes: ['UNIT_SCOPED_G1_G10'],
    timeBudgetMinutes: runtimeProductContext.studyMinutes,
    productMode: runtimeProductContext.productMode,
  };
  const sourceTaskContext = {
    kind: 'EXAM_TASK',
    family: task.family,
    subtype: task.subtype,
    taskId: task.task_id,
    requirements: Array.isArray(payload.requirementBullets) ? payload.requirementBullets : [],
    taskPayload: payload,
    learnerAttempt: answers,
    lookupExposure,
    unitId:firstUnit?.unitId,
    responseKey:firstUnit?.responseKey,
    previousLearnerResponse:firstUnit?answers[firstUnit.responseKey]:undefined,
  } as const;
  function diagnosticProbe(decision:QualifiedInnerTutorDecisionV1){
    const diagnosis=decision.lineage?.context.sourceTaskContext?.familyDiagnosis as {discriminatingActions?:readonly string[]}|undefined,actions=diagnosis?.discriminatingActions??[];
    if(!actions.length)return undefined;
    const result=resolveProductionExamContentV1({family:task.family,learnerId,role:'DISCRIMINATING_PROBE',targetRef:decision.provenance.targetRef,facet:decision.provenance.facet as CapabilityFacet,diagnosticPurpose:actions[0],competingHypotheses:actions,recent:[{taskId:task.task_id,contentHash:examContentHashV1(task),contentLineage:task.content_lineage_id,freshnessGroupId:task.freshness_group_id}],rotationKey:decision.provenance.decisionPointId});
    return result.status==='READY'?{taskId:result.content.task.task_id,payload:result.content.task.payload,diagnosticCapabilities:result.content.diagnosticCapabilities,cannotProve:result.content.cannotProve,contentReceipt:result.content.receipt}:undefined;
  }

  const latestRef = useRef({ answers, activeBlank, sourceOpen, teacherMessage, teacherDecision, interaction, interactionText, done });
  useEffect(()=>{latestRef.current={answers,activeBlank,sourceOpen,teacherMessage,teacherDecision,interaction,interactionText,done}},[answers,activeBlank,sourceOpen,teacherMessage,teacherDecision,interaction,interactionText,done]);

  async function learnerTruth() {
    if (Platform.OS === 'web') return canonicalLearnerTruthV1.project(learnerId);
    return projectLearnerModelV3(learnerId, await operationalHistoryReadPortV1.canonicalEvidence(learnerId));
  }

  function baseRuntime() {
    return runtimeRef.current ?? createExamOperationalRuntimeV1({
      sessionId,
      learnerId: learnerId,
      taskId: task.task_id,
      contentHash:examContentHashV1(task),
      family: task.family,
      subtype: task.subtype,
      freshnessIdentity,
    });
  }

  async function persistLatest(status?: ExamOperationalRuntimeV1['status']) {
    if (!hydrated && !runtimeRef.current) return undefined;
    const current = latestRef.current;
    const next = updateExamOperationalRuntimeV1(baseRuntime(), {
      responses: current.answers,
      activeBlankId: current.activeBlank,
      sourceOpen: current.sourceOpen,
      interactionText: current.interactionText,
      teacherMessage: current.teacherMessage,
      teacherDecision: current.teacherDecision ?? null,
      activeInteraction: current.interaction ?? null,
      phase: current.done ? 'COMPLETED' : current.interaction ? 'TEACHER_INTERACTION' : 'ANSWERING',
      status: status ?? (current.done ? 'COMPLETED' : 'LEARNING'),
    });
    runtimeRef.current = next;
    await saveExamOperationalCheckpointV1(examLessonPlanForDecisionV1(lessonPlan, current.teacherDecision), next);
    return next;
  }
  async function exitExam(){if(exitInFlightRef.current)return;exitInFlightRef.current=true;try{await persistLatest(done?'COMPLETED':'PAUSED');if(!done)await savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:'SESSION_PAUSED',phase:interaction?'TEACHER_INTERACTION':'ANSWERING',eventKey:'exit'});router.replace('/(tabs)/practice')}finally{exitInFlightRef.current=false}}
  useLearnerBack(exitExam);

  useEffect(() => {
    let live = true;
    void (async () => {
      const stored = await loadExamOperationalCheckpointV1(learnerId, sessionId);
      if (!live) return;
      const resumed = resumableExamOperationalRuntimeV1(stored?.runtime, learnerId, sessionId);
      const isResume = Boolean(resumed && resumed.taskId === task.task_id);
      if (isResume && resumed) {
        runtimeRef.current = resumed;
        setAnswers({ ...resumed.responses });
        setActiveBlank(resumed.activeBlankId);
        setSourceOpen(resumed.sourceOpen);
        setTeacherDecision(resumed.teacherDecision);
        setInteraction(resumed.activeInteraction as ExamTeacherInteractionV1 | undefined);
        setInteractionText(resumed.interactionText);
        setTeacherMessage(resumed.teacherMessage);
        setDone(false);
        setResumeMessage('已接回你剛才做到的地方。');
      } else {
        runtimeRef.current = createExamOperationalRuntimeV1({
          sessionId,
          learnerId: learnerId,
          taskId: task.task_id,
          contentHash:examContentHashV1(task),
          family: task.family,
          subtype: task.subtype,
          freshnessIdentity,
        });
      }
      const [alreadyPulsed, shouldAskWeek] = await Promise.all([hasPrivateBetaPulseV1(learnerId, sessionId), shouldAskWeekOneSurveyV1(learnerId)]);
      setPulseDone(alreadyPulsed);
      setWeekSurveyDue(shouldAskWeek);
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: isResume ? 'SESSION_RESUMED' : 'SESSION_OPENED', phase: isResume ? resumed?.phase : 'ANSWERING', eventKey: `visit:${privateBetaLocalDateV1()}` });
      if(!isResume)await savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:'PRACTICE_STARTED',phase:'ANSWERING',eventKey:'practice-start'});
      setHydrated(true);
    })();
    return () => { live = false; };
  }, [learnerId, sessionId, task.task_id]);

  useEffect(() => {
    if (!hydrated || done) return;
    const timer = setTimeout(() => { void persistLatest(); }, 700);
    return () => clearTimeout(timer);
  }, [answers, activeBlank, sourceOpen, interactionText, hydrated, done]);

  async function applyDecision(decision: QualifiedInnerTutorDecisionV1 | undefined, fallback: string, previous?: QualifiedInnerTutorDecisionV1) {
    const nextInteraction = decision ? buildExamTeacherInteractionV1({ decision, sessionId, sourceTaskContext:{...sourceTaskContext,...decision.lineage?.context.sourceTaskContext,registeredDiagnosticProbe:diagnosticProbe(decision)} }) : undefined;
    const nextDone = !nextInteraction;
    const message = nextDone ? (decision?.experience.narrator?.message ?? fallback) : '';
    setTeacherDecision(decision);
    setInteraction(nextInteraction);
    setInteractionText('');
    setDone(nextDone);
    setTeacherMessage(message);

    const nextRuntime = updateExamOperationalRuntimeV1(baseRuntime(), {
      responses: answers,
      activeBlankId: activeBlank,
      sourceOpen,
      interactionText: '',
      teacherMessage: message,
      teacherDecision: decision ?? null,
      activeInteraction: nextInteraction ?? null,
      phase: nextDone ? 'COMPLETED' : 'TEACHER_INTERACTION',
      status: nextDone ? 'COMPLETED' : 'LEARNING',
    });
    runtimeRef.current = nextRuntime;
    const boundPlan = examLessonPlanForDecisionV1(lessonPlan, decision);
    if (decision) await persistExamTeacherLineageV1({ learnerId: learnerId, sessionId, lessonPlan: boundPlan, runtime: nextRuntime, decision, previousDecision: previous });
    else await saveExamOperationalCheckpointV1(boundPlan, nextRuntime);
    if (nextInteraction && decision) {
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'TEACHER_INTERACTION_SHOWN', phase: 'TEACHER_INTERACTION', interactionMode: nextInteraction.mode, teacherAction: decision.action, mechanismId: decision.provenance.selectedMechanismId, eventKey: `shown:${decision.provenance.decisionPointId}` });
      if (previous && previous.provenance.selectedMechanismId !== decision.provenance.selectedMechanismId) await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'TEACHER_RECOMPOSED', phase: 'TEACHER_INTERACTION', interactionMode: nextInteraction.mode, teacherAction: decision.action, mechanismId: decision.provenance.selectedMechanismId, eventKey: `recomposed:${decision.provenance.decisionPointId}` });
    } else if (nextDone) {
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'SESSION_COMPLETED', phase: 'COMPLETED', teacherAction: decision?.action, mechanismId: decision?.provenance.selectedMechanismId, eventKey: 'completed' });
    }
    return nextRuntime;
  }

  async function submit() {
    if(submitInFlightRef.current)return;submitInFlightRef.current=true;setBusy(true);
    try {
      const submitted=updateExamOperationalRuntimeV1(baseRuntime(),{responses:answers,submittedAt:new Date().toISOString()});runtimeRef.current=submitted;await saveExamOperationalCheckpointV1(lessonPlan,submitted);
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'RESPONSE_SUBMITTED', phase: 'ANSWERING', eventKey: `response:${runtimeRef.current?.decisionHistory.length ?? 0}` });
      const truth = await learnerTruth();
      const localSemantic = assessExamSemanticUnitsV1({ task, response: answers });
      const liveSemantic=['TRANSLATION','WRITING'].includes(task.family)?await assessGsatSemanticLiveV1({task,response:answers,lookupExposure,request:requestGsatSemanticAssessment}):undefined;
      const semantic = liveSemantic?{...localSemantic,decisionsByUnitId:{...localSemantic.decisionsByUnitId,...liveSemantic}}:localSemantic;
      const result: CanonicalExamSubmissionResultV1 = await submitExamToCanonicalTeacherV1({
        learnerId: learnerId,
        sessionId,
        task,
        lessonPlan,
        productContext: runtimeProductContext,
        learnerTruth: truth,
        response: answers,
        semanticAssessmentsByUnitId: semantic.decisionsByUnitId,
        lookupExposure,
        support: assessmentSupport,
        freshnessIdentity,
        provider: examTeacherProvider,
        priorDecisions: submitted.teacherDecision ? [submitted.teacherDecision] : [],
      });
      if(result.assessment!=='NOT_EVALUATED')await recordTutorialAction('FIRST_MICRO_ACTION_COMPLETED',submitted.submitActionId,'/exam-practice');
      const runtime = await applyDecision(result.teacherDecision, result.assessment === 'NOT_EVALUATED' ? '這一單元目前不能安全評分。' : '這次作答已完成。');
      const admissions = admitExamEvidenceV1({ learnerId: learnerId, sessionId, task, result, support: assessmentSupport, lookupExposure, freshnessIdentity });
      await persistExamEvidenceAdmissionsV1({ learnerId: learnerId, sessionId, lessonPlan: examLessonPlanForDecisionV1(lessonPlan, result.teacherDecision), runtime, units: admissions });
      await recordExamTaskHistoryV1({learnerId,task,purpose:allocationPurpose,attemptId:runtime.attemptId});
      if(allocationPurpose==='FRESH_CHECK'&&result.assessment!=='NOT_EVALUATED')await recordTutorialAction('FIRST_FRESH_ATTEMPT_COMPLETED',`fresh:${runtime.attemptId}`,'/exam-practice');
    } finally {
      submitInFlightRef.current=false;
      setBusy(false);
    }
  }

  async function completeInteraction(kind: 'SUBMITTED' | 'IMPASSE' | 'RETURNED') {
    if (!teacherDecision || submitInFlightRef.current) return;
    submitInFlightRef.current=true;
    setBusy(true);
    try {
      const before = teacherDecision;
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'TEACHER_INTERACTION_COMPLETED', phase: 'TEACHER_INTERACTION', interactionMode: interaction?.mode, teacherAction: before.action, mechanismId: before.provenance.selectedMechanismId, eventKey: `interaction-completed:${before.provenance.decisionPointId}` });
      const checkpoint = updateExamOperationalRuntimeV1(baseRuntime(), { interactionText, teacherDecision: before, activeInteraction: interaction ?? null, phase: 'TEACHER_INTERACTION' });
      runtimeRef.current = checkpoint;
      await saveExamOperationalCheckpointV1(examLessonPlanForDecisionV1(lessonPlan, before), checkpoint);
      const unitId=String(before.lineage?.context.sourceTaskContext?.unitId??firstUnit?.unitId??'');
      const unit=task.canonicalBinding?.units.find(item=>item.unitId===unitId);
      const evaluation=kind==='SUBMITTED'&&['PRACTICE','ASSESS'].includes(before.blockDecision.pedagogicalIntent)?evaluateExamTeacherInteractionV1({task,unitId,learnerResponse:interactionText,previousLearnerResponse:unit?answers[unit.responseKey]:undefined,support:before.blockDecision.supportLevel,lookupExposure,decision:before}):undefined;
      if(evaluation?.outcome==='NOT_EVALUATED'){
        const guarded=updateExamOperationalRuntimeV1(checkpoint,{interactionEvaluation:{...evaluation,evaluationId:`evaluation:${before.provenance.decisionPointId}`},teacherMessage:'這個答案目前還不能安全判斷，請再補完整一點。'});
        runtimeRef.current=guarded;setTeacherMessage('這個答案目前還不能安全判斷，請再補完整一點。');
        await saveExamOperationalCheckpointV1(examLessonPlanForDecisionV1(lessonPlan,before),guarded);return;
      }
      if(evaluation){const evaluated=updateExamOperationalRuntimeV1(checkpoint,{interactionEvaluation:{...evaluation,evaluationId:`evaluation:${before.provenance.decisionPointId}`}});runtimeRef.current=evaluated;await saveExamOperationalCheckpointV1(examLessonPlanForDecisionV1(lessonPlan,before),evaluated)}
      const truth = await learnerTruth();
      const next = await continueExamTeacherAfterInteractionV1({
        learnerId: learnerId,
        sessionId,
        lessonPlan,
        productContext: runtimeProductContext,
        learnerTruth: truth,
        previousDecision: before,
        completion: { kind, response: interactionText, evaluatedOutcome:evaluation?.outcome },
        sourceTaskContext:{...sourceTaskContext,...before.lineage?.context.sourceTaskContext,registeredDiagnosticProbe:diagnosticProbe(before)},
        provider: examTeacherProvider,
      });
      await applyDecision(next, '這一小步完成了。', before);
      if(evaluation&&evaluation.outcome!=='FAILURE')await recordTutorialAction('FIRST_TEACHER_REPAIR_COMPLETED',`repair:${before.provenance.decisionPointId}`,'/exam-practice');
      const supportRank:Record<string,number>={MODELED:5,EXPLICIT:4,GUIDED:3,CUED:2,LIGHT:1,NONE:0};
      if(evaluation?.outcome==='SUCCESS'&&(supportRank[next.blockDecision.supportLevel]??9)<(supportRank[before.blockDecision.supportLevel]??9))await recordTutorialAction('FIRST_SUPPORT_FADE_COMPLETED',`fade:${next.provenance.decisionPointId}`,'/exam-practice');
      if(kind!=='IMPASSE'&&!coachMarks.teacher)markCoach('teacher');
    } finally {
      submitInFlightRef.current=false;
      setBusy(false);
    }
  }

  async function startFreshAttempt(){
    if(busy)return;setBusy(true);
    try{
      const history=await loadExamTaskHistoryV1(learnerId,task.family),recent=[...history,{taskId:task.task_id,contentHash:examContentHashV1(task),contentLineage:task.content_lineage_id,freshnessGroupId:task.freshness_group_id}],resolution=resolveProductionExamContentV1({family:task.family,learnerId,role:'INDEPENDENT_ASSESS',rotationKey:`${sessionId}:fresh`,recent}),fresh=resolution.status==='READY'?resolution.content.task:undefined;
      if(!fresh){setTeacherMessage('目前沒有另一題符合相同範圍且通過驗證的獨立題；這次進展會保留，稍後再確認。');return}
      // The teaching session is closed by an explicit fresh-check handoff. The
      // new task owns the remaining episode, so Today must not revive this one.
      await persistLatest('COMPLETED');
      router.replace(`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(task.family))}&taskId=${encodeURIComponent(fresh.task_id)}&purpose=FRESH_CHECK&sourceSession=${encodeURIComponent(sessionId)}` as Href);
    }finally{setBusy(false)}
  }

  async function submitBetaPulse() {
    if (!pulseUsefulness || !pulseFriction || !pulseReturn) return;
    await savePrivateBetaPulseV1({
      learnerId,
      sessionId,
      taskId: task.task_id,
      family: task.family,
      usefulness: pulseUsefulness,
      friction: pulseFriction,
      returnTomorrow: pulseReturn,
      redundantNote: pulseNote,
    });
    await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'PULSE_SUBMITTED', phase: 'COMPLETED', eventKey: 'pulse' });
    setPulseDone(true);
    setWeekSurveyDue(await shouldAskWeekOneSurveyV1(learnerId));
  }

  async function submitWeekOneSurvey() {
    if(!missMost.trim()||!difference.trim()||!keepUsing||!recommend||!paidReaction||!substitute.trim())return;
    await savePrivateBetaWeekOneSurveyV2({learnerId,missMost,difference,keepUsing,recommend,substitute,paidReaction,reason:weekReason});
    await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'WEEK_ONE_SURVEY_SUBMITTED', phase: 'COMPLETED', eventKey: 'week-one' });
    setWeekSurveyDone(true);
    setWeekSurveyDue(false);
  }

  function reportContent(){void savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:'CONTENT_REPORTED',phase:'COMPLETED',eventKey:`content-report:${runtimeRef.current?.attemptId??'attempt'}`})}

  const setAnswer = (id: string, value: string) => {setAnswers(current => ({ ...current, [id]: value }));if(!coachMarks.mcq)markCoach('mcq')};
  const lookupMode=formal?'FORMAL_ASSESSMENT' as const:'NONE' as const;
  const recordLookup=(result:{senseId?:string;lemma?:string})=>{setLookupExposure(current=>[...new Set([...current,result.senseId??result.lemma??'lookup'])]);if(!coachMarks.lookup)markCoach('lookup')};
  const recordLookupResult=(result:{status:string})=>void savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:result.status==='LOCKED'?'LOOKUP_LOCKED':result.status==='RESOLVED'?'LOOKUP_OPENED':'LOOKUP_UNRESOLVED',eventKey:`lookup:${result.status}:${runtimeRef.current?.attemptId??'pending'}`});
  const option = (id: string, item: Option) => (<View key={item.id} style={[styles.option,answers[id]===item.id&&styles.selected]}><Pressable accessibilityRole="radio" accessibilityLabel={`選擇 ${item.id}`} accessibilityState={{selected:answers[id]===item.id}} onPress={()=>setAnswer(id,item.id)} style={styles.selector}><Text style={styles.selectorText}>{item.id}</Text></Pressable><View style={styles.optionLookup}><UniversalLookupText text={item.text} assessmentMode={lookupMode} submitted={done} onLookupUsed={recordLookup}onLookupResult={recordLookupResult}/></View></View>);
  const blanks = (payload.blanks as (Blank | string)[] | undefined) ?? [];
  const questions = (payload.questions as Question[] | undefined) ?? [];
  const parts = (payload.parts as Question[] | undefined) ?? [];
  const shared = ((payload.options ?? payload.sentenceOptions) as Option[] | undefined) ?? [];
  const hasResponse=Object.values(answers).some(value=>value.trim().length>0);

  return <Shell onBack={exitExam}>
    <View style={styles.progressRow}><Text style={styles.kicker}>考試練習</Text><Text style={styles.progressText}>{familyLabel[task.family]??'英文'}</Text></View>
    <Text style={styles.title}>{String(payload.title ?? payload.sourceTitle ?? '英文練習')}</Text>
    {allocationPurpose==='REVIEW_ONLY'?<Text style={styles.lockNotice}>這題是複習題，不會當成一題全新的獨立能力確認。</Text>:null}
    {resumeMessage ? <Text style={styles.resume}>{resumeMessage}</Text> : null}
    {task.family === 'MIXED' ? <Button label={sourceOpen ? '收起素材' : '重新開啟素材'} onPress={() => setSourceOpen(value => !value)} /> : null}
    {formal&&!done?<Text style={styles.lockNotice}>模考中先不提供查字。交卷後可以查。</Text>:null}
    {(payload.passage || payload.source) && sourceOpen ? <UniversalLookupText text={String(payload.passage || payload.source)} assessmentMode={lookupMode} submitted={done} showHint={!formal&&!coachMarks.lookup} style={styles.passage} onLookupUsed={recordLookup}onLookupResult={recordLookupResult}/> : null}

    {!teacherDecision && !done ? <>
      <ContextualSpotlight active={!coachMarks.mcq&&task.family!=='TRANSLATION'&&task.family!=='WRITING'} copy="選答案點圓圈；想查英文就直接點文字。"><View style={styles.answerArea}>
      {task.family === 'COMPREHENSIVE' ? blanks.map(value => {
        const blank = value as Blank;
        return <View key={blank.id} style={styles.block}><Text style={styles.label}>第 {blank.id} 空</Text>{blank.options?.map(item => option(blank.id, item))}</View>;
      }) : null}
      {shared.length ? <>
        <View style={styles.row}>{blanks.map(value => {
          const id = typeof value === 'string' ? value : value.id;
          return <Pressable key={id} onPress={() => setActiveBlank(id)} style={[styles.blank, activeBlank === id && styles.selected]}><Text>{id}: {answers[id] ?? '＿'}</Text></Pressable>;
        })}</View>
        <Text style={styles.label}>目前作答：第 {activeBlank} 空（可重新選）</Text>
        {shared.map(item => option(activeBlank, item))}
      </> : null}
      {questions.map(question => <View key={question.id} style={styles.block}><UniversalLookupText text={question.prompt} assessmentMode={lookupMode} style={styles.label} onLookupUsed={recordLookup}/>{question.options?.map(item => option(question.id, item))}</View>)}
      {parts.map(part => <View key={part.id} style={styles.block}><UniversalLookupText text={part.prompt} assessmentMode={lookupMode} style={styles.label} onLookupUsed={recordLookup}/>{part.options ? part.options.map(item => option(part.id, item)) : <TextInput value={answers[part.id] ?? ''} onChangeText={value => setAnswer(part.id, value)} style={styles.input} />}</View>)}
      {task.family === 'TRANSLATION' ? (payload.chineseSentences as string[]).map((sentence, index) => <View key={sentence} style={styles.block}><Text style={styles.zh}>{sentence}</Text><TextInput multiline value={answers[String(index)] ?? ''} onChangeText={value => setAnswer(String(index), value)} style={styles.input} /></View>) : null}
      {task.family === 'WRITING' ? <><UniversalLookupText text={String(payload.prompt)} instruction style={styles.zh}/>{(payload.requirementBullets as string[]).map(item => <UniversalLookupText key={item} text={`• ${item}`} instruction/>)}<TextInput multiline value={answers.writing ?? ''} onChangeText={value => setAnswer('writing', value)} style={[styles.input, styles.long]} />{answers.writing?.trim()?<UniversalLookupText text={answers.writing} sourceFamily="WRITING" taskId={task.task_id} responsePhase="PRE_RESPONSE" assessmentMode={lookupMode} submitted={done} onLookupUsed={recordLookup} onLookupResult={recordLookupResult}/>:null}</> : null}
      </View></ContextualSpotlight>
      <Button label={busy ? '正在確認…' : '送出答案'} disabled={busy||!hasResponse} onPress={() => { if (!busy&&hasResponse) void submit(); }} />
    </> : null}

    {interaction ? <View style={styles.teacherCard}>
      <Text style={styles.teacherEyebrow}>Teacher</Text>
      <Text style={styles.teacherTitle}>{interaction.title}</Text>
      {teacherDecision?.experience.narrator?.message ? <Text style={styles.note}>{teacherDecision.experience.narrator.message}</Text> : null}
      {teacherDecision?.composition?.pieces[teacherDecision.composition.cursor]?.kind==='FRESH_ATTEMPT'?<View style={styles.teacherAction}><Text style={styles.passage}>提示已拿掉。接著換一份不同內容，由你自己完成。</Text><Button label={busy?'正在準備…':'開始新的無提示題'} disabled={busy} onPress={()=>void startFreshAttempt()}/></View>:<ContextualSpotlight active={!coachMarks.teacher} copy="先照這一步做，我會看你的答案再換下一步。"><View style={styles.teacherAction}><UniversalLookupText text={interaction.prompt} showHint={!coachMarks.lookup} assessmentMode="NONE" style={styles.passage} onLookupUsed={recordLookup}/>
      {['FREE_PRODUCTION','REPAIR'].includes(interaction.mode) ? <TextInput multiline value={interactionText} onChangeText={setInteractionText} placeholder={interaction.placeholder} style={[styles.input, styles.long]} /> : null}
      {!['FREE_PRODUCTION','REPAIR','RETURN'].includes(interaction.mode) ? <View style={styles.block}>{interaction.options?.map(item=><Pressable accessibilityRole="radio" accessibilityState={{selected:interactionText===item.id}} key={item.id} onPress={()=>setInteractionText(item.id)} style={[styles.option,interactionText===item.id&&styles.selected]}><Text>{item.label}</Text></Pressable>)}</View> : null}
      <Button label={busy ? '處理中…' : interaction.mode === 'RETURN' ? '回到原作' : '完成這一步'} disabled={busy||(interaction.mode!=='RETURN'&&!interactionText.trim())} onPress={() => { if (!busy)void completeInteraction(interaction.mode === 'RETURN' ? 'RETURNED' : 'SUBMITTED'); }} /></View></ContextualSpotlight>}
      {teacherDecision?.composition?.pieces[teacherDecision.composition.cursor]?.kind!=='FRESH_ATTEMPT'&&interaction.mode !== 'RETURN' ? <Pressable disabled={busy} onPress={() => void completeInteraction('IMPASSE')}><Text style={styles.secondary}>我還是不會，換個方法</Text></Pressable> : null}
    </View> : null}

    {done ? <>
      <Text style={styles.note}>{teacherMessage}</Text>
      <Button label="查看這次結果" onPress={()=>router.replace(`/result?origin=TODAY&practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(task.family))}&sessionId=${encodeURIComponent(sessionId)}` as Href)}/>
      <Pressable accessibilityRole="button" onPress={reportContent}><Text style={styles.secondary}>回報內容問題</Text></Pressable>
      {!pulseDone ? <View style={styles.pulseCard}>
        <Text style={styles.teacherEyebrow}>10 秒回饋 · 不影響你的英文紀錄</Text>
        <Text style={styles.pulseQuestion}>這次真的有幫助嗎？</Text>
        <RatingRow value={pulseUsefulness} onChange={setPulseUsefulness} low="沒幫助" high="很有用" />
        <Text style={styles.pulseQuestion}>這次有多累／多麻煩？</Text>
        <RatingRow value={pulseFriction} onChange={setPulseFriction} low="很輕" high="很累" />
        <Text style={styles.pulseQuestion}>明天沒人提醒，你會自己再打開嗎？</Text>
        <View style={styles.row}>{(['YES','MAYBE','NO'] as PrivateBetaReturnIntentV1[]).map(value => <Pressable key={value} onPress={() => setPulseReturn(value)} style={[styles.pulseChoice, pulseReturn === value && styles.selected]}><Text>{value === 'YES' ? '會' : value === 'MAYBE' ? '可能' : '不會'}</Text></Pressable>)}</View>
        <TextInput value={pulseNote} onChangeText={setPulseNote} placeholder="哪一步最煩、多餘或想改？（可空白）" style={styles.input} />
        <Button label="送出回饋" onPress={() => { void submitBetaPulse(); }} />
        <Pressable onPress={() => setPulseDone(true)}><Text style={styles.secondary}>先跳過</Text></Pressable>
      </View> : <Text style={styles.pulseThanks}>謝謝，這次回饋已記下。</Text>}
      {weekSurveyDue && !weekSurveyDone ? <View style={styles.pulseCard}>
        <Text style={styles.teacherEyebrow}>第一週回饋 · 只問一次</Text>
        <Text style={styles.pulseQuestion}>如果 EOT 消失，你最想念什麼？</Text><TextInput value={missMost}onChangeText={setMissMost}style={styles.input}/>
        <Text style={styles.pulseQuestion}>它跟單字 App、講義或 ChatGPT 哪裡不一樣？</Text><TextInput value={difference}onChangeText={setDifference}style={styles.input}/>
        <Text style={styles.pulseQuestion}>你自己會繼續用嗎？</Text><IntentRow value={keepUsing}onChange={setKeepUsing}/>
        <Text style={styles.pulseQuestion}>你會推薦給另一位學測生嗎？</Text><IntentRow value={recommend}onChange={setRecommend}/>
        <TextInput value={substitute} onChangeText={setSubstitute} placeholder="不用 EOT 的話，你會改用什麼？" style={styles.input} />
        <Text style={styles.pulseQuestion}>如果需要付費，你現在的反應是？</Text><View style={styles.weekChoices}>{([['WOULD_CONSIDER','會考慮'],['NOT_SURE','不確定'],['FREE_ONLY','只用免費'],['WOULD_NOT_USE','不會使用']]as const).map(([value,label])=><Pressable key={value}onPress={()=>setPaidReaction(value)}style={[styles.pulseChoice,paidReaction===value&&styles.selected]}><Text>{label}</Text></Pressable>)}</View>
        <TextInput value={weekReason} onChangeText={setWeekReason} placeholder="原因（可空白）" style={styles.input} />
        <Button label="送出第一週回饋" onPress={() => { void submitWeekOneSurvey(); }} />
      </View> : null}
    </> : null}
    <Button label="回到練習" onPress={() => void exitExam()} />
  </Shell>;
}

function RatingRow({ value, onChange, low, high }: { value?: PrivateBetaRatingV1; onChange: (value: PrivateBetaRatingV1) => void; low: string; high: string }) {
  return <View><View style={styles.ratingRow}>{([1,2,3,4,5] as PrivateBetaRatingV1[]).map(item => <Pressable key={item} onPress={() => onChange(item)} style={[styles.rating, value === item && styles.selected]}><Text style={styles.ratingText}>{item}</Text></Pressable>)}</View><View style={styles.ratingLegend}><Text style={styles.ratingLegendText}>{low}</Text><Text style={styles.ratingLegendText}>{high}</Text></View></View>;
}
function IntentRow({value,onChange}:{value?:PrivateBetaReturnIntentV1;onChange:(value:PrivateBetaReturnIntentV1)=>void}){return <View style={styles.row}>{(['YES','MAYBE','NO']as const).map(x=><Pressable key={x}onPress={()=>onChange(x)}style={[styles.pulseChoice,value===x&&styles.selected]}><Text>{x==='YES'?'會':x==='MAYBE'?'可能':'不會'}</Text></Pressable>)}</View>}

function Shell({ children,onBack }: { children: React.ReactNode;onBack?:()=>void }) {
  return <SafeAreaView style={styles.safe}><KeyboardAwareScrollView style={styles.safe} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={90}>{onBack?<Pressable accessibilityRole="button" accessibilityLabel="返回" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹ 返回</Text></Pressable>:null}{children}</KeyboardAwareScrollView></SafeAreaView>;
}
function Button({ label, onPress, disabled=false }: { label: string; onPress: () => void; disabled?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,disabled&&styles.buttonDisabled,pressed&&!disabled&&styles.pressed]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.colors.background },
  content: { width: '100%', maxWidth: t.layout.learnerShellMaxWidth, alignSelf: 'center', padding: t.spacing.lg, paddingBottom: 100, gap: 16 },
  back:{minHeight:44,alignSelf:'flex-start',justifyContent:'center',paddingRight:18},backText:{color:t.colors.deepWood,fontWeight:'800'},
  progressRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},progressText:{fontSize:12,fontWeight:'800',color:t.colors.subtle},
  lockNotice:{padding:12,borderRadius:12,backgroundColor:t.colors.focusWash,color:t.colors.focus,fontSize:13,lineHeight:20,fontWeight:'700'},
  coach:{padding:12,borderRadius:12,backgroundColor:t.colors.woodWash,borderWidth:2,borderColor:t.colors.deepWood},
  kicker: { fontSize:12,fontWeight: '900', color: t.colors.midWood,letterSpacing:.7 }, title: { fontSize: 27,lineHeight:35, fontWeight: '900',letterSpacing:-.3,color:t.colors.ink }, passage: { fontSize: 17, lineHeight: 29,color:t.colors.ink }, zh: { fontSize: 18, lineHeight: 29,color:t.colors.ink },
  answerArea:{gap:10},teacherAction:{gap:14},block: { gap: 10, paddingVertical: 9 }, label: { fontSize:15,lineHeight:23,fontWeight: '900',color:t.colors.ink }, option: { minHeight: 54, padding: 10, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.medium, flexDirection:'row',alignItems:'center',gap:12,backgroundColor: t.colors.paper },selector:{width:36,height:36,borderRadius:18,borderWidth:1,borderColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},selectorText:{fontWeight:'900',color:t.colors.deepWood},optionLookup:{flex:1}, selected: { borderColor: t.colors.deepWood, backgroundColor: t.colors.woodWash },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, blank: { minWidth: 58,minHeight:44,justifyContent:'center', padding: 10, borderWidth: 1, borderColor: t.colors.line, borderRadius: 10 }, input: { minHeight: 56, borderWidth: 1, borderColor: t.colors.line, borderRadius: t.radius.medium, padding: 15, backgroundColor: t.colors.paper,color:t.colors.ink,fontSize:16,lineHeight:24, textAlignVertical: 'top' }, long: { minHeight: 190 },
  button: { minHeight: 56, borderRadius: t.radius.medium, backgroundColor: t.colors.deepWood, alignItems: 'center', justifyContent: 'center' },buttonDisabled:{opacity:.4},pressed:{opacity:.88,transform:[{scale:.99}]}, buttonText: { color: t.colors.paper,fontSize:16, fontWeight: '900' }, note: { padding: 13,borderRadius:12, backgroundColor: t.colors.successWash, color: t.colors.success,lineHeight:21 }, resume: { padding: 12, borderRadius: 11, backgroundColor: t.colors.woodWash, color: t.colors.deepWood, fontWeight: '800' }, teacherCard: { gap: 14, padding: 18, borderRadius: t.radius.xlarge, backgroundColor: t.colors.paper }, teacherEyebrow: { fontSize: 12, fontWeight: '900', color: t.colors.midWood }, teacherTitle: { fontSize: 22,lineHeight:30, fontWeight: '900', color: t.colors.ink }, secondary: { minHeight:44,textAlign: 'center',textAlignVertical:'center', fontWeight: '800', color: t.colors.midWood },
  pulseCard: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: woodTheme.colors.paper, borderWidth: 1, borderColor: woodTheme.colors.line }, pulseQuestion: { fontSize: 15, fontWeight: '800', color: woodTheme.colors.ink }, pulseChoice: { flex: 1, minWidth: 80, minHeight: 44, borderWidth: 1, borderColor: woodTheme.colors.line, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, ratingRow: { flexDirection: 'row', gap: 8 }, rating: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: woodTheme.colors.line, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, ratingText: { fontWeight: '800' }, ratingLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, ratingLegendText: { fontSize: 11, color: woodTheme.colors.subtle }, pulseThanks: { fontSize: 12, color: woodTheme.colors.muted, textAlign: 'center' }, weekChoices: { gap: 8 },
});
