import { eotLearnerTokensV1 as woodTheme } from '../src/ui/tokens';
import { Href, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { savePrivateBetaProductEventV1 } from '../src/market-validation/privateBetaPulse';
import { privateBetaLocalDateV1 } from '../src/market-validation/privateBetaAnalytics';
import { eotLearnerTokensV1 as t } from '../src/ui';
import { UniversalLookupText } from '../components/learning/UniversalLookupText';
import {useLearnerBack} from '../components/experience/useLearnerBack';
import { requestGsatSemanticAssessment, requestQualifiedBlockDecision } from '../lib/teacherApi';
import { createExamTeacherProviderV1 } from '../src/application/exam/examTeacherProvider';
import { assessGsatSemanticLiveV1 } from '../src/application/exam/gsatLiveSemanticAssessment';
import { evaluateExamTeacherInteractionV1 } from '../src/application/exam/examInteractionEvaluator';
import type { CapabilityFacet } from '../src/domain/english/EnglishDomain';
import {projectExamLearnerActionV1} from '../src/application/exam/examPuzzleProjection';
import type {LearnerActionEvent} from '../src/ui/learnerActionSurface';
import {LearnerActionRenderer} from '../components/learning/PuzzleRenderers';

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
  if (!task || !selection) return <Shell onBack={exitToPractice}><Text style={styles.title}>目前沒有可用的題目</Text><Button label="返回練習" onPress={exitToPractice} /></Shell>;
  return <ExamPracticeSession task={task} sessionId={selection.sessionId} allocationPurpose={selection.purpose} learnerId={learnerPreferences.learnerId} runtimeProductContext={runtimeProductContext} coachMarks={profile.gsatBeta.coachMarks} markCoach={name=>void updateProductContext({gsatBeta:{coachMarks:{[name]:true}}})} recordTutorialAction={async(...args)=>{if(profile.onboarding.status!=='COMPLETED'&&profile.onboarding.firstDay?.milestones.TODAY_STARTED)await recordTutorialAction(...args)}} formal={params.formal==='1'} />;
}

function ExamPracticeSession({ task, sessionId, allocationPurpose, learnerId, runtimeProductContext,coachMarks,markCoach,recordTutorialAction,formal=false }: { task: ExamBetaTask; sessionId: string; allocationPurpose:ExamAllocationPurposeV1; learnerId: string; runtimeProductContext: ProductContextV1;coachMarks:{teacher:boolean;mcq?:boolean;lookup?:boolean};markCoach:(name:'teacher'|'mcq'|'lookup')=>void;recordTutorialAction:ReturnType<typeof useCanonicalProductData>['recordTutorialAction'];formal?:boolean }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [localWrong,setLocalWrong]=useState<Record<string,boolean>>({});
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
  const [writingPromptOpen,setWritingPromptOpen]=useState(true);
  const [transportError,setTransportError]=useState(false);
  const[lookupExposure,setLookupExposure]=useState<string[]>([]);
  const runtimeRef = useRef<ExamOperationalRuntimeV1 | null>(null);
  const submitInFlightRef=useRef(false);
  const exitInFlightRef=useRef(false);
  const tapCommitPendingRef=useRef(false);

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
    expectedResponse:firstUnit?String((task.answer_or_rubric as {answers?:Record<string,unknown>}|undefined)?.answers?.[firstUnit.responseKey]??''):undefined,
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
    if(submitInFlightRef.current)return;submitInFlightRef.current=true;setTransportError(false);setBusy(true);
    try {
      const submitted=updateExamOperationalRuntimeV1(baseRuntime(),{responses:answers,submittedAt:new Date().toISOString()});runtimeRef.current=submitted;await saveExamOperationalCheckpointV1(lessonPlan,submitted);
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'RESPONSE_SUBMITTED', phase: 'ANSWERING', eventKey: `response:${runtimeRef.current?.decisionHistory.length ?? 0}` });
      const truth = await learnerTruth();
      const localSemantic = assessExamSemanticUnitsV1({ task, response: answers });
      const liveSemantic=['TRANSLATION','WRITING'].includes(task.family)?await assessGsatSemanticLiveV1({task,response:answers,lookupExposure,request:requestGsatSemanticAssessment}):undefined;
      const usableLive=liveSemantic?Object.fromEntries(Object.entries(liveSemantic).filter(([unitId,decision])=>{
        if(decision.abstained||['AMBIGUOUS','ABSTAIN'].includes(decision.outcome))return false;
        const local=localSemantic.decisionsByUnitId[unitId];
        // A model may recognize a valid alternative, but it must not erase a
        // deterministic writing constraint or the local realization firewall.
        if(task.family==='WRITING'&&decision.outcome==='CORRECT'&&local&&(local.outcome==='PARTIALLY_CORRECT'||local.reasonCodes.some(code=>code.includes('NOT_MET')||code.includes('INSUFFICIENT')||code.includes('NOT_SAFELY_QUALIFIED'))))return false;
        return true;
      })):{};
      const semantic = liveSemantic?{...localSemantic,decisionsByUnitId:{...localSemantic.decisionsByUnitId,...usableLive}}:localSemantic;
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
    } catch {
      setTransportError(true);
    } finally {
      submitInFlightRef.current=false;
      setBusy(false);
    }
  }

  async function completeInteraction(kind: 'SUBMITTED' | 'IMPASSE' | 'RETURNED',responseOverride?:string) {
    if (!teacherDecision || submitInFlightRef.current) return;
    submitInFlightRef.current=true;
    setTransportError(false);
    setBusy(true);
    try {
      const before = teacherDecision,responseText=responseOverride??interactionText;
      if(responseOverride!==undefined)setInteractionText(responseOverride);
      await savePrivateBetaProductEventV1({ learnerId, sessionId, taskId: task.task_id, family: task.family, type: 'TEACHER_INTERACTION_COMPLETED', phase: 'TEACHER_INTERACTION', interactionMode: interaction?.mode, teacherAction: before.action, mechanismId: before.provenance.selectedMechanismId, eventKey: `interaction-completed:${before.provenance.decisionPointId}` });
      const checkpoint = updateExamOperationalRuntimeV1(baseRuntime(), { interactionText:responseText, teacherDecision: before, activeInteraction: interaction ?? null, phase: 'TEACHER_INTERACTION' });
      runtimeRef.current = checkpoint;
      await saveExamOperationalCheckpointV1(examLessonPlanForDecisionV1(lessonPlan, before), checkpoint);
      if(task.family==='VOCABULARY'&&interaction?.mode==='CHUNK_RECONSTRUCTION'&&kind==='SUBMITTED'&&responseText===sourceTaskContext.expectedResponse){
        await startFreshAttempt(true);
        return;
      }
      const unitId=String(before.lineage?.context.sourceTaskContext?.unitId??firstUnit?.unitId??'');
      const unit=task.canonicalBinding?.units.find(item=>item.unitId===unitId);
      const evaluation=kind==='SUBMITTED'&&['PRACTICE','ASSESS'].includes(before.blockDecision.pedagogicalIntent)?evaluateExamTeacherInteractionV1({task,unitId,learnerResponse:responseText,previousLearnerResponse:unit?answers[unit.responseKey]:undefined,support:before.blockDecision.supportLevel,lookupExposure,decision:before}):undefined;
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
        completion: { kind, response:responseText, evaluatedOutcome:evaluation?.outcome },
        sourceTaskContext:{...sourceTaskContext,...before.lineage?.context.sourceTaskContext,registeredDiagnosticProbe:diagnosticProbe(before)},
        provider: examTeacherProvider,
      });
      await applyDecision(next, '這一小步完成了。', before);
      if(evaluation&&evaluation.outcome!=='FAILURE')await recordTutorialAction('FIRST_TEACHER_REPAIR_COMPLETED',`repair:${before.provenance.decisionPointId}`,'/exam-practice');
      const supportRank:Record<string,number>={MODELED:5,EXPLICIT:4,GUIDED:3,CUED:2,LIGHT:1,NONE:0};
      if(evaluation?.outcome==='SUCCESS'&&(supportRank[next.blockDecision.supportLevel]??9)<(supportRank[before.blockDecision.supportLevel]??9))await recordTutorialAction('FIRST_SUPPORT_FADE_COMPLETED',`fade:${next.provenance.decisionPointId}`,'/exam-practice');
      if(kind!=='IMPASSE'&&!coachMarks.teacher)markCoach('teacher');
    } catch {
      setTransportError(true);
    } finally {
      submitInFlightRef.current=false;
      setBusy(false);
    }
  }

  async function startFreshAttempt(force=false){
    if(busy&&!force)return;setBusy(true);
    try{
      const targetRef=teacherDecision?.provenance.targetRef??firstUnit?.canonicalTargetRef,facet=(teacherDecision?.provenance.facet??firstUnit?.canonicalFacet)as CapabilityFacet|undefined;
      const history=await loadExamTaskHistoryV1(learnerId,task.family),recent=[...history,{taskId:task.task_id,contentHash:examContentHashV1(task),contentLineage:task.content_lineage_id,freshnessGroupId:task.freshness_group_id}],resolution=resolveProductionExamContentV1({family:task.family,learnerId,role:'INDEPENDENT_ASSESS',targetRef,facet,rotationKey:`${sessionId}:fresh`,recent}),fresh=resolution.status==='READY'?resolution.content.task:undefined;
      if(!fresh){setTeacherMessage('目前沒有另一題符合相同範圍且通過驗證的獨立題；這次進展會保留，稍後再確認。');return}
      // Moving from a supported repair into a clean task is the observable
      // support-fade event. Persist both receipts before the fresh task can
      // complete, otherwise first-use completion can outrun its prerequisites.
      await recordTutorialAction('FIRST_TEACHER_REPAIR_COMPLETED',`repair-to-fresh:${runtimeRef.current?.attemptId??sessionId}`,'/exam-practice');
      await recordTutorialAction('FIRST_SUPPORT_FADE_COMPLETED',`fade-to-fresh:${fresh.task_id}`,'/exam-practice');
      // The teaching session is closed by an explicit fresh-check handoff. The
      // new task owns the remaining episode, so Today must not revive this one.
      await persistLatest('COMPLETED');
      router.replace(`/exam-practice?practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(task.family))}&taskId=${encodeURIComponent(fresh.task_id)}&purpose=FRESH_CHECK&sourceSession=${encodeURIComponent(sessionId)}` as Href);
    }finally{setBusy(false)}
  }

  function reportContent(){void savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:'CONTENT_REPORTED',phase:'COMPLETED',eventKey:`content-report:${runtimeRef.current?.attemptId??'attempt'}`})}

  const setAnswer = (id: string, value: string) => {setAnswers(current => ({ ...current, [id]: value }));const expected=String((task.answer_or_rubric as {answers?:Record<string,unknown>}|undefined)?.answers?.[id]??'');if(expected)setLocalWrong(current=>({...current,[id]:value!==expected}));if(!coachMarks.mcq)markCoach('mcq')};
  const lookupMode=formal?'FORMAL_ASSESSMENT' as const:'NONE' as const;
  const recordLookup=(result:{senseId?:string;lemma?:string})=>{setLookupExposure(current=>[...new Set([...current,result.senseId??result.lemma??'lookup'])]);if(!coachMarks.lookup)markCoach('lookup')};
  const recordLookupResult=(result:{status:string})=>void savePrivateBetaProductEventV1({learnerId,sessionId,taskId:task.task_id,family:task.family,type:result.status==='LOCKED'?'LOOKUP_LOCKED':result.status==='RESOLVED'?'LOOKUP_OPENED':'LOOKUP_UNRESOLVED',eventKey:`lookup:${result.status}:${runtimeRef.current?.attemptId??'pending'}`});
  const learnerSurface=interaction&&teacherDecision?projectExamLearnerActionV1({decision:teacherDecision,interaction,task,learnerResponse:firstUnit?answers[firstUnit.responseKey]:undefined}):undefined;
  const commitLearnerAction=(event:LearnerActionEvent)=>{
    const response=typeof event.value==='string'?event.value:JSON.stringify(event.value);
    void completeInteraction('SUBMITTED',response);
  };
  // Choice rows are one unambiguous action: tapping commits the answer. Their
  // text is lookup-protected because lookup can leak the answer and must never
  // collide with the parent answer target.
  const commitChoice=(id:string,value:string)=>{if(answers[id]!==undefined)return;tapCommitPendingRef.current=true;setAnswer(id,value)};
  const option = (id: string, item: Option) => {const committed=answers[id]!==undefined,chosen=answers[id]===item.id,wrong=chosen&&localWrong[id];return <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={`選擇 ${item.id}，${item.text}`} accessibilityState={{selected:chosen,disabled:committed}} disabled={committed} onPress={()=>commitChoice(id,item.id)} style={[styles.option,chosen&&styles.selected,wrong&&styles.wrongOption,committed&&!chosen&&styles.optionCommittedOut]}><View style={styles.selector}><Text style={styles.selectorText}>{wrong?'×':item.id}</Text></View><Text style={styles.optionText}>{item.text}</Text></Pressable>};
  const blanks = (payload.blanks as (Blank | string)[] | undefined) ?? [];
  const questions = (payload.questions as Question[] | undefined) ?? [];
  const parts = (payload.parts as Question[] | undefined) ?? [];
  const shared = ((payload.options ?? payload.sentenceOptions) as Option[] | undefined) ?? [];
  const hasResponse=Object.values(answers).some(value=>value.trim().length>0);
  const choiceIds=task.family==='COMPREHENSIVE'?blanks.filter(value=>typeof value!=='string'&&Boolean(value.options?.length)).map(value=>(value as Blank).id):shared.length?blanks.map(value=>typeof value==='string'?value:value.id):questions.length&&questions.every(item=>Boolean(item.options?.length))?questions.map(item=>item.id):parts.length&&parts.every(item=>Boolean(item.options?.length))?parts.map(item=>item.id):[];
  const tapCommitsChoiceSet=choiceIds.length>0&&!['TRANSLATION','WRITING'].includes(task.family),hasAllChoiceResponses=tapCommitsChoiceSet&&choiceIds.every(id=>Boolean(answers[id]?.trim()));
  const sourceText=String(payload.passage||payload.source||'');
  const sourceRepeatsPrompt=Boolean(sourceText&&questions.some(question=>question.prompt.trim()===sourceText.trim()));
  const submitLabel=task.family==='WRITING'?'完成修改':task.family==='TRANSLATION'?'完成翻譯':'送出答案';
  useEffect(()=>{if(!tapCommitPendingRef.current)return;tapCommitPendingRef.current=false;if(hasAllChoiceResponses&&hydrated&&!teacherDecision&&!done&&!busy)setTimeout(()=>void submit(),0)},[answers]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Shell onBack={exitExam} family={familyLabel[task.family]??'英文'}>
    {resumeMessage ? <Text style={styles.resume}>{resumeMessage}</Text> : null}
    {task.family === 'MIXED' ? <Pressable accessibilityRole="button" accessibilityState={{expanded:sourceOpen}} onPress={() => setSourceOpen(value => !value)} style={styles.sourceToggle}><Text style={styles.sourceToggleText}>{sourceOpen ? '題目素材　收起' : '題目素材　展開'}</Text></Pressable> : null}
    {formal&&!done?<Text style={styles.lockNotice}>模考中先不提供查字。交卷後可以查。</Text>:null}
    {sourceText&&sourceOpen&&!sourceRepeatsPrompt ? <UniversalLookupText text={sourceText} assessmentMode={lookupMode} submitted={done} showHint={!formal&&!coachMarks.lookup} style={styles.passage} onLookupUsed={recordLookup}onLookupResult={recordLookupResult}/> : null}

    {!teacherDecision && !done ? <>
      <View style={styles.answerArea}>
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
        {shared.filter(item=>!Object.entries(answers).some(([id,value])=>id!==activeBlank&&value===item.id)).map(item => ['CONTEXTUAL_FILL','DISCOURSE'].includes(task.family)?<DraggableOption key={item.id} item={item} onDrop={()=>setAnswer(activeBlank,item.id)}/>:option(activeBlank, item))}
      </> : null}
      {questions.map(question => <View key={question.id} style={styles.block}><UniversalLookupText text={question.prompt} assessmentMode={lookupMode} style={styles.label} onLookupUsed={recordLookup}/>{question.options?.map(item => option(question.id, item))}</View>)}
      {parts.map(part => <View key={part.id} style={styles.block}><UniversalLookupText text={part.prompt} assessmentMode={lookupMode} style={styles.label} onLookupUsed={recordLookup}/>{part.options ? part.options.map(item => option(part.id, item)) : <TextInput value={answers[part.id] ?? ''} onChangeText={value => setAnswer(part.id, value)} style={styles.input} />}</View>)}
      {task.family === 'TRANSLATION' ? (payload.chineseSentences as string[]).map((sentence, index) => <View key={sentence} style={styles.authoredBlock}><Text style={styles.authoredLabel}>中文</Text><Text style={styles.zh}>{sentence}</Text><Text style={styles.authoredLabel}>你的翻譯</Text><TextInput accessibilityLabel="你的翻譯" multiline value={answers[String(index)] ?? ''} onChangeText={value => setAnswer(String(index), value)} placeholder="從這裡開始寫" placeholderTextColor={t.colors.subtle} style={styles.authoredInput}/></View>) : null}
      {task.family === 'WRITING' ? <View style={styles.writingWorkspace}><Pressable accessibilityRole="button" accessibilityState={{expanded:writingPromptOpen}} onPress={()=>setWritingPromptOpen(value=>!value)} style={styles.promptToggle}><Text style={styles.authoredLabel}>{writingPromptOpen?'題目':'查看題目'}</Text><Text style={styles.promptChevron}>{writingPromptOpen?'收起':''}</Text></Pressable>{writingPromptOpen?<><UniversalLookupText text={String(payload.prompt)} instruction style={styles.zh}/><View style={styles.requirements}>{(payload.requirementBullets as string[]).map(item => <UniversalLookupText key={item} text={`• ${item}`} instruction style={styles.requirement}/>)}</View></>:null}<Text style={styles.authoredLabel}>你的文章</Text><TextInput accessibilityLabel="你的文章" multiline value={answers.writing ?? ''} onChangeText={value => {setAnswer('writing', value);if(!answers.writing?.trim()&&value.trim())setWritingPromptOpen(false)}} placeholder="寫下你的第一版" placeholderTextColor={t.colors.subtle} style={[styles.authoredInput, styles.long]} />{answers.writing?.trim()?<UniversalLookupText text={answers.writing} sourceFamily="WRITING" taskId={task.task_id} responsePhase="PRE_RESPONSE" assessmentMode={lookupMode} submitted={done} onLookupUsed={recordLookup} onLookupResult={recordLookupResult}/>:null}</View> : null}
      </View>
      {tapCommitsChoiceSet?busy?<Text style={styles.checking}>正在看你的選擇…</Text>:<Text style={styles.checking}>{Object.keys(answers).filter(id=>choiceIds.includes(id)).length}／{choiceIds.length}</Text>:<Button label={busy ? '正在確認…' : submitLabel} disabled={busy||!hasResponse} onPress={() => { if (!busy&&hasResponse) void submit(); }} />}
    </> : null}

    {interaction&&learnerSurface ? <View style={styles.repairRegion}>
      {teacherDecision?.composition?.pieces[teacherDecision.composition.cursor]?.kind==='FRESH_ATTEMPT'?<Button label={busy?'正在準備…':'換一題'} disabled={busy} onPress={()=>void startFreshAttempt()}/>:<LearnerActionRenderer surface={learnerSurface} onEvent={commitLearnerAction}/>}
    </View> : null}

    {transportError?<View accessibilityRole="alert" style={styles.transportError}><Text style={styles.transportCopy}>剛才沒有送出去。你的內容還在。</Text><Pressable accessibilityRole="button" onPress={()=>void (teacherDecision?completeInteraction('SUBMITTED'):submit())} style={styles.retryAction}><Text style={styles.retryText}>再試一次</Text></Pressable></View>:null}

    {done ? <View style={styles.completion}><Text style={styles.completionMark}>✓</Text><Text style={styles.completionTitle}>這次先到這裡</Text>{teacherMessage?<Text style={styles.completionBody}>{teacherMessage}</Text>:null}<Button label="看看這次改變了什麼" onPress={()=>router.replace(`/result?origin=TODAY&practiceFamily=${encodeURIComponent(examFamilyToPracticeFamilyV1(task.family))}&sessionId=${encodeURIComponent(sessionId)}` as Href)}/><Pressable accessibilityRole="button" onPress={reportContent}><Text style={styles.secondary}>回報內容問題</Text></Pressable></View> : null}
  </Shell>;
}

function Shell({ children,onBack,family }: { children: React.ReactNode;onBack?:()=>void;family?:string }) {
  const[menu,setMenu]=useState(false);
  return <SafeAreaView style={styles.safe}><View style={styles.fixedTop}>{onBack?<Pressable accessibilityRole="button" accessibilityLabel="返回" onPress={onBack} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>:<View style={styles.back}/>}<Text style={styles.headerFamily}>{family??''}</Text><Pressable accessibilityRole="button" accessibilityLabel="更多選項" onPress={()=>setMenu(value=>!value)} style={styles.back}><Text style={styles.more}>•••</Text></Pressable></View>{menu&&onBack?<View style={styles.menu}><Pressable onPress={onBack} style={styles.menuAction}><Text style={styles.menuText}>結束這次練習</Text></Pressable></View>:null}<KeyboardAwareScrollView style={styles.safe} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bottomOffset={100}>{children}</KeyboardAwareScrollView></SafeAreaView>;
}
function Button({ label, onPress, disabled=false }: { label: string; onPress: () => void; disabled?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={({pressed})=>[styles.button,disabled&&styles.buttonDisabled,pressed&&!disabled&&styles.pressed]}><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
function DraggableOption({item,onDrop}:{item:Option;onDrop:()=>void}){const[position]=useState(()=>new Animated.ValueXY()),responder=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:()=>true,onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),onPanResponderRelease:()=>{onDrop();Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:true}).start()},onPanResponderTerminate:()=>Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:true}).start()}),[onDrop,position]);return <Animated.View accessibilityRole="button" accessibilityLabel={`拖曳 ${item.text} 到目前空格`} accessibilityHint="拖到空格，或點一下直接放入" onAccessibilityTap={onDrop} {...responder.panHandlers} style={[styles.dragToken,{transform:position.getTranslateTransform()}]}><Text style={styles.optionText}>{item.text}</Text></Animated.View>}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.colors.background },
  fixedTop:{height:48,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:t.colors.divider},headerFamily:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.colors.ink},more:{fontSize:16,color:t.colors.muted,textAlign:'right'},menu:{position:'absolute',zIndex:5,top:50,right:20,backgroundColor:t.colors.surface,borderWidth:1,borderColor:t.colors.divider,borderRadius:10,padding:6},menuAction:{minHeight:44,paddingHorizontal:14,justifyContent:'center'},menuText:{fontSize:14,color:t.colors.ink},content: { width: '100%', maxWidth:390, alignSelf: 'center', paddingHorizontal:20,paddingTop:14, paddingBottom: 110, gap: 20 },
  back:{width:44,height:44,justifyContent:'center'},backText:{color:t.colors.deepWood,fontSize:20},
  sourceToggle:{minHeight:44,alignSelf:'flex-start',justifyContent:'center'},sourceToggleText:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.colors.deepWood},lessonMeta:{minHeight:24,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},independent:{fontSize:12,lineHeight:18,color:t.colors.success,fontWeight:'600'},
  lockNotice:{padding:12,borderRadius:12,backgroundColor:t.colors.focusWash,color:t.colors.focus,fontSize:13,lineHeight:20,fontWeight:'700'},
  coach:{padding:12,borderRadius:12,backgroundColor:t.colors.woodWash,borderWidth:2,borderColor:t.colors.deepWood},
  kicker: { fontSize:12,lineHeight:18,fontWeight:'500', color:t.colors.muted }, title: { fontSize:24,lineHeight:31,fontWeight:'600',color:t.colors.ink }, passage: { fontSize:17,lineHeight:27,color:t.colors.ink }, zh: { fontSize:18,lineHeight:29,color:t.colors.ink },
  answerArea:{gap:10},teacherAction:{gap:16},block: { gap: 4, paddingVertical: 9 }, label: { fontSize:15,lineHeight:23,fontWeight: '900',color:t.colors.ink }, option: { minHeight: 60, paddingVertical:10, borderBottomWidth: 1, borderColor: t.colors.line, flexDirection:'row',alignItems:'center',gap:12 },wrongOption:{backgroundColor:t.colors.dangerWash,borderColor:t.colors.danger},optionCommittedOut:{opacity:.42},selector:{width:34,height:34,borderRadius:17,borderWidth:1,borderColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},selectorText:{fontWeight:'900',color:t.colors.deepWood},optionText:{flex:1,fontSize:16,lineHeight:24,color:t.colors.ink}, selected: { borderColor: t.colors.deepWood, backgroundColor:t.colors.woodWash },teacherChoice:{minHeight:58,paddingVertical:12,borderBottomWidth:1,borderColor:t.colors.line,justifyContent:'center'},teacherChoiceText:{fontSize:16,lineHeight:24,color:t.colors.ink},evidenceTray:{flexDirection:'row',flexWrap:'wrap',gap:9,paddingVertical:8},evidencePiece:{minHeight:48,paddingHorizontal:13,paddingVertical:10,borderRadius:12,borderWidth:1,borderColor:t.colors.lightWood,backgroundColor:t.colors.paper,justifyContent:'center'},evidencePieceOn:{backgroundColor:t.colors.focusWash,borderColor:t.colors.focus},evidenceText:{fontSize:14,lineHeight:20,fontWeight:'700',color:t.colors.ink},evidenceTextOn:{color:t.colors.deepWood},contrastBoard:{borderTopWidth:1,borderTopColor:t.colors.line},contrastRow:{minHeight:62,paddingVertical:10,borderBottomWidth:1,borderBottomColor:t.colors.line,flexDirection:'row',alignItems:'center',gap:14},contrastRowOn:{backgroundColor:t.colors.focusWash},contrastWord:{width:82,fontSize:17,fontWeight:'900',color:t.colors.deepWood},contrastCue:{flex:1,fontSize:14,lineHeight:21,color:t.colors.muted},chunkBoard:{flexDirection:'row',flexWrap:'wrap',gap:10,paddingVertical:8},chunkPiece:{minHeight:52,paddingHorizontal:14,paddingVertical:11,borderRadius:10,borderWidth:1,borderColor:t.colors.lightWood,backgroundColor:t.colors.paper},chunkPieceOn:{borderColor:t.colors.focus,backgroundColor:t.colors.focusWash,transform:[{translateY:-2}]},chunkText:{fontSize:15,fontWeight:'800',color:t.colors.ink},chunkTextOn:{color:t.colors.deepWood},
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, blank: { minWidth: 58,minHeight:44,justifyContent:'center', padding: 10, borderWidth: 1, borderColor: t.colors.line, borderRadius: 10 }, input: { minHeight: 56, borderBottomWidth: 1, borderColor: t.colors.dividerStrong, paddingVertical: 15,color:t.colors.ink,fontSize:16,lineHeight:24, textAlignVertical: 'top' }, authoredBlock:{gap:12,paddingVertical:8},writingWorkspace:{gap:14},promptToggle:{minHeight:44,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},promptChevron:{fontSize:12,lineHeight:18,color:t.colors.muted},authoredLabel:{fontSize:12,lineHeight:18,fontWeight:'500',color:t.colors.muted},authoredInput:{minHeight:128,paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.dividerStrong,color:t.colors.ink,fontSize:17,lineHeight:27,textAlignVertical:'top'},requirements:{gap:4,paddingBottom:8},requirement:{fontSize:14,lineHeight:21,color:t.colors.muted},wordCount:{fontSize:12,lineHeight:18,color:t.colors.subtle,textAlign:'right'},long: { minHeight:280 },
  dragToken:{minHeight:52,paddingHorizontal:14,justifyContent:'center',borderBottomWidth:1,borderBottomColor:t.colors.divider,backgroundColor:t.colors.surface,zIndex:2},
  transportError:{paddingVertical:12,borderTopWidth:1,borderBottomWidth:1,borderColor:t.colors.danger,gap:8},transportCopy:{fontSize:14,lineHeight:21,color:t.colors.ink},retryAction:{minHeight:44,alignSelf:'flex-start',justifyContent:'center'},retryText:{fontSize:14,lineHeight:21,fontWeight:'600',color:t.colors.danger},button:{minHeight:52,borderRadius:14,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center'},buttonDisabled:{opacity:.4},pressed:{opacity:.9,transform:[{scale:.98}]},buttonText:{color:t.colors.paper,fontSize:16,fontWeight:'600'},checking:{minHeight:44,textAlign:'center',textAlignVertical:'center',fontSize:14,color:t.colors.muted},note:{padding:12,backgroundColor:t.colors.successWash,color:t.colors.success,lineHeight:21},resume:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:t.colors.line,color:t.colors.deepWood,fontWeight:'600'},repairRegion:{gap:24,paddingVertical:8},contextThread:{gap:7,opacity:.58,paddingBottom:18,borderBottomWidth:1,borderBottomColor:t.colors.divider},contextText:{fontSize:15,lineHeight:24,color:t.colors.muted},teacherRail:{flexDirection:'row',gap:14},repairRule:{width:3,borderRadius:2,backgroundColor:t.colors.focus},teacherRailBody:{flex:1,gap:16},teacherTitle:{fontSize:16,lineHeight:24,fontWeight:'600',color:t.colors.ink},stuckAction:{minHeight:52,alignItems:'center',justifyContent:'center',gap:2},stuckText:{fontSize:14,fontWeight:'600',color:t.colors.midWood},stuckHint:{fontSize:11,color:t.colors.subtle},secondary:{minHeight:44,textAlign:'center',textAlignVertical:'center',fontWeight:'600',color:t.colors.midWood},completion:{paddingVertical:34,gap:16,alignItems:'stretch'},completionMark:{display:'none'},completionTitle:{fontSize:24,lineHeight:31,fontWeight:'600',color:t.colors.ink},completionBody:{fontSize:16,lineHeight:24,color:t.colors.muted},
  freshHandoff:{minHeight:460,justifyContent:'center',gap:16},freshTitle:{fontSize:24,lineHeight:31,fontWeight:'600',color:t.colors.ink},pulseCard: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: woodTheme.colors.paper, borderWidth: 1, borderColor: woodTheme.colors.line }, pulseQuestion: { fontSize: 15, fontWeight: '800', color: woodTheme.colors.ink }, pulseChoice: { flex: 1, minWidth: 80, minHeight: 44, borderWidth: 1, borderColor: woodTheme.colors.line, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, ratingRow: { flexDirection: 'row', gap: 8 }, rating: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: woodTheme.colors.line, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, ratingText: { fontWeight: '800' }, ratingLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }, ratingLegendText: { fontSize: 11, color: woodTheme.colors.subtle }, pulseThanks: { fontSize: 12, color: woodTheme.colors.muted, textAlign: 'center' }, weekChoices: { gap: 8 },
});
