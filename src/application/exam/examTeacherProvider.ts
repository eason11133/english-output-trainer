import type { InnerTutorDecisionInputV1, InnerTutorProposalV1 } from '../../teacher-runtime';
import type { QualifiedBlockSelectionV4 } from '../stage4/blockDecisionAdapterV4';
import { blockRegistryV4 } from '../v4/blockRegistryV4';

type BlockRequest = (context: unknown) => Promise<{
  decision: QualifiedBlockSelectionV4;
  validation: { valid: boolean; errors: string[] };
  telemetry?: { callId?: string; model?: string; responseId?: string; latencyMs?: number; inputTokens?: number; outputTokens?: number };
}>;

// Reuse the production model boundary. E still qualifies every proposal; this
// adapter neither evaluates learner language nor admits evidence.
export function createExamTeacherProviderV1(request: BlockRequest): InnerTutorDecisionInputV1['provider'] {
  return async context => {
    const source = context.sourceTaskContext;
    const response = await request({
      registeredBlockContract: blockRegistryV4.providerContract(),
      pedagogicalContext: context,
      currentAuthenticWork: source?.learnerResponse ?? source?.learnerAttempt,
      currentObjective: { curriculumLessonPlan: context.lessonPlan, taskContext: source },
      supportHistory: context.recentTreatmentResponses,
      sourceStatus: 'AVAILABLE',
    });
    if (!response.validation.valid) throw new Error('exam_teacher_provider_validation_failed');
    // D owns target/facet authority. The model selects HOW; task-local unit IDs
    // must never be allowed to replace the canonical LessonPlan identity.
    const proposal: InnerTutorProposalV1 = { ...response.decision, targetReference: context.lessonPlan.targetRef, focusFacet: context.lessonPlan.facet, lessonPlanId: context.lessonPlan.id };
    const receipt = response.telemetry;
    // Allowlist provider telemetry; never persist request headers or arbitrary
    // server metadata in the decision lineage.
    if (receipt?.callId && receipt.model && receipt.responseId) proposal.providerReceipt = {
      provider: 'OpenAI', callId: receipt.callId, model: receipt.model, responseId: receipt.responseId,
      latencyMs: receipt.latencyMs, inputTokens: receipt.inputTokens, outputTokens: receipt.outputTokens,
    };
    return proposal;
  };
}
