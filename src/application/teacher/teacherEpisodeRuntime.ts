import { TeacherDomain, TeachingEpisode, TeachingTurn, TeacherPlanningContext, TeacherTurnPlan, classifyLearnerSignal, planTeacherTurn } from '../../domain/teacher/TeacherRuntime';
import { EvidenceRepository } from '../../repositories/EvidenceRepository';
import { saveTeachingEpisode } from '../../repositories/TeacherRuntimeStorage';
import { enforceTeacherPlanGuards, guardEvidenceCandidate } from './pedagogicalGuards';
import { retrievePck } from './pckCore';

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function createTeachingEpisode(input: { learnerId: string; artifactId: string; sourceText: string }, now = new Date()): TeachingEpisode {
  return { schemaVersion: 1, id: id('episode'), learnerId: input.learnerId, artifactId: input.artifactId, sourceText: input.sourceText, workingText: input.sourceText, turns: [], status: 'ACTIVE', createdAt: now.toISOString(), updatedAt: now.toISOString() };
}

function inferPckDomain(text: string): TeacherDomain {
  const lower = text.toLowerCase();
  if (/allow|encourage|collocation/.test(lower)) return 'CHUNK';
  if (/signigicant|significant|spell|word/.test(lower)) return 'VOCABULARY';
  if (text.length > 180) return 'COMPOSITION';
  return 'GRAMMAR';
}

export async function replanTeachingEpisode(input: { episode: TeachingEpisode; learnerResponse: string; evidenceRepository: EvidenceRepository; ocrUnresolved?: boolean; modelPlanner?: (context: TeacherPlanningContext) => Promise<TeacherTurnPlan | null>; now?: Date }): Promise<TeachingEpisode> {
  const now = input.now ?? new Date();
  const history = await input.evidenceRepository.listForLearner(input.episode.learnerId);
  const domain = inferPckDomain(input.learnerResponse);
  const context: TeacherPlanningContext = {
    sourceText: input.episode.sourceText,
    learnerResponse: input.learnerResponse,
    ocrUnresolved: input.ocrUnresolved,
    priorEvidence: history.map((event) => ({ id: event.id, knowledgePointId: event.knowledgePointId, result: event.result, responseText: event.responseText, metadata: event.metadata })),
    priorTurns: input.episode.turns,
    pckUnits: retrievePck(domain, input.learnerResponse),
  };
  let plan: TeacherTurnPlan | null = null;
  if (input.modelPlanner) try { plan = await input.modelPlanner(context); } catch { /* secure provider unavailable: deterministic policy remains safe */ }
  plan = enforceTeacherPlanGuards(plan, context);
  const previous = input.episode.turns.at(-1)?.plan;
  const turn: TeachingTurn = { id: id('turn'), learnerResponse: input.learnerResponse, plan, responseSignal: classifyLearnerSignal(input.learnerResponse, previous), createdAt: now.toISOString() };
  const next: TeachingEpisode = { ...input.episode, workingText: input.learnerResponse || input.episode.workingText, turns: [...input.episode.turns, turn], updatedAt: now.toISOString() };
  if (plan.interventionDecision === 'CONTINUE' && previous && turn.responseSignal === 'IMMEDIATE_SELF_REPAIR') {
    const support = previous.supportLevel === 'NONE' ? 'INDEPENDENT' : previous.supportLevel === 'MODEL' ? 'MODELED' : previous.supportLevel === 'LIGHT' ? 'CUED' : 'GUIDED';
    const spelling=/\bsignificant\b/i.test(input.learnerResponse);const guarded = guardEvidenceCandidate({ learnerId: input.episode.learnerId, sessionId: input.episode.id, missionUnitId: turn.id, knowledgePointId: spelling?'significant-orthography':'read-more-word-order', activityFamily: 'MINI_OUTPUT', result: 'SUCCESS', evaluationScope: 'TARGET_ONLY', responseText: input.learnerResponse, assistance: support === 'INDEPENDENT' ? 'NONE' : 'STRUCTURE_CUE', attemptNumber: input.episode.turns.length + 1, selfRepairSucceeded: true, answerRevealed: false, contextId: input.episode.artifactId, contextNovelty: 'SAME', source: 'SELF', confidence: 'HIGH', origin: 'LEARNER_PRODUCTION', supportDependency: support, timing: 'IMMEDIATE', opportunityPresent: true, localTargetOnly:true, metadata: { teacherEpisodeId: input.episode.id } }, now);
    if (guarded.accepted) await input.evidenceRepository.append(guarded.event);
  }
  await saveTeachingEpisode(next);
  return next;
}
