import { coreEnglishDomainPortV2 } from '../../domain/english';
import { CanonicalEvidenceEventV3, EvidenceCandidateV3 } from '../../domain/evidence/EvidenceCandidateV3';
import { TaskContract, taskAllowsClaim } from '../../domain/task/TaskContract';
import { productionConditionsAllowIndependentV1 } from '../../domain/task/productionConditions';
import { qualifyMeasurementV1 } from '../../assessment/measurement';

export type EvidenceGuardResultV3 =
  | { accepted: true; event: CanonicalEvidenceEventV3 }
  | { accepted: false; reasons: string[] };

export function guardEvidenceCandidateV3(input: {
  candidate: EvidenceCandidateV3;
  task: TaskContract | null;
  learnerId: string;
  id: string;
  occurredAt: string;
}): EvidenceGuardResultV3 {
  const candidate = input.candidate;
  const reasons: string[] = [];

  if (candidate.candidateKind === 'OCR_CORRECTION') reasons.push('OCR correction is not learner learning evidence');
  if (candidate.candidateKind === 'NO_CAPABILITY_EVIDENCE' || candidate.candidateKind === 'GOAL_CONTEXT') {
    reasons.push('candidate explicitly carries no capability evidence');
  }
  if (candidate.evidenceEligibility !== 'ELIGIBLE') reasons.push(`evidence eligibility is ${candidate.evidenceEligibility}`);
  if (!candidate.taskAffordanceChecked) reasons.push('task affordance was not checked');

  if (candidate.productionMode === 'INDEPENDENT' && candidate.supportBeforeResponse !== 'NONE') {
    reasons.push('supported response cannot be independent');
  }
  if (candidate.productionMode === 'INDEPENDENT') {
    const conditionCheck=productionConditionsAllowIndependentV1(candidate.productionConditions);
    reasons.push(...conditionCheck.reasons.map(reason=>`independent production condition invalid: ${reason}`));
  }
  if (candidate.productionMode === 'MODELED' && candidate.supportBeforeResponse !== 'MODEL') {
    reasons.push('modeled production must preserve model support');
  }
  if ((candidate.contextNovelty === 'CHANGED_CONTEXT' || candidate.contextNovelty === 'DELAYED_CONTEXT') && candidate.productionMode !== 'INDEPENDENT') {
    reasons.push('assisted response cannot prove transfer or retention');
  }
  if (candidate.semanticProvenance === 'TEACHER_SUPPLIED' && candidate.capabilityFacet === 'SPONTANEOUS_DEPLOYMENT') {
    reasons.push('teacher-supplied meaning cannot prove independent composition');
  }

  if (!candidate.targetRef || !candidate.capabilityFacet) reasons.push('capability target and facet are required');
  if(candidate.targetRef&&candidate.capabilityFacet){
    const canonicalTarget=coreEnglishDomainPortV2.resolveId(candidate.targetRef);
    if(!canonicalTarget)reasons.push('capability target must resolve to canonical English Domain identity');
    else if(!coreEnglishDomainPortV2.supportsFacet(canonicalTarget,candidate.capabilityFacet))reasons.push('canonical target does not afford requested capability facet');
  }

  if (candidate.evidencePolarity === 'NEGATIVE') {
    if (candidate.opportunityPresent !== true) reasons.push('negative evidence requires an observed target opportunity');
    if (candidate.confidence === 'LOW') reasons.push('low-confidence failure cannot become negative capability evidence');
    if (candidate.productionMode === 'NOT_PRODUCTION') reasons.push('non-production cannot become negative production evidence');
  }

  if (input.task && candidate.targetRef && candidate.capabilityFacet && !taskAllowsClaim(input.task, {
    targetRef: candidate.targetRef,
    facet: candidate.capabilityFacet,
  })) {
    reasons.push('task affordance forbids claim');
  }
  if (input.task && candidate.contextNovelty !== 'NOT_APPLICABLE' && candidate.contextNovelty !== input.task.contextNovelty) {
    reasons.push('task context provenance forbids claim');
  }
  if(input.task&&candidate.productionConditions&&input.task.productionConditions&&JSON.stringify(candidate.productionConditions)!==JSON.stringify(input.task.productionConditions))reasons.push('task production conditions diverge from observed response conditions');
  if (!input.task && candidate.candidateKind === 'CAPABILITY') reasons.push('capability evidence requires a task contract');
  if(candidate.candidateKind==='CAPABILITY'){
    const measurement=qualifyMeasurementV1({candidate,task:input.task,occurredAt:input.occurredAt});
    // C owns immutable learner-history admission while K owns what a performance may prove.
    // An UNKNOWN-polarity capability observation is intentionally preserved as history so the
    // learner model can remain UNKNOWN with explicit uncertainty; K still abstains and grants
    // NO_CAPABILITY_PROOF. Do not turn K abstention into deletion of the underlying observation.
    const historyOnlyUnknown = candidate.evidencePolarity==='UNKNOWN'
      && measurement.proofClass==='NO_CAPABILITY_PROOF'
      && measurement.abstained;
    if(!measurement.eligible&&!historyOnlyUnknown)reasons.push(...measurement.reasons.map(reason=>`measurement qualification rejected: ${reason}`));
  }

  if (reasons.length) return { accepted: false, reasons };

  return {
    accepted: true,
    event: {
      ...candidate,
      id: input.id,
      schemaVersion: 3,
      learnerId: input.learnerId,
      occurredAt: input.occurredAt,
      immutable: true,
    },
  };
}
