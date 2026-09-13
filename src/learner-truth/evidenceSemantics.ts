import { coreEnglishDomainPortV2 } from '../domain/english';
import { productionConditionsAllowIndependentV1 } from '../domain/task/productionConditions';
import {
  CanonicalEvidenceEventV3,
  EvidenceCandidateV3,
  EvidenceConditionReliabilityV1,
  EvidenceProvenanceV1,
  EvidenceUncertaintyV1,
} from '../domain/evidence/EvidenceCandidateV3';

export function resolveCanonicalEvidenceTargetV1(candidate: EvidenceCandidateV3): string | undefined {
  if (!candidate.targetRef || !candidate.capabilityFacet) return undefined;
  const resolved = coreEnglishDomainPortV2.resolveId(candidate.targetRef);
  if (!resolved) return undefined;
  return coreEnglishDomainPortV2.supportsFacet(resolved, candidate.capabilityFacet) ? resolved : undefined;
}

export function evidenceConditionReliabilityV1(candidate: EvidenceCandidateV3, canonicalTargetRef?: string): EvidenceConditionReliabilityV1 {
  if (candidate.confidence === 'LOW') return 'LOW';
  if (candidate.evidencePolarity === 'UNKNOWN') return 'UNKNOWN';
  if (candidate.candidateKind !== 'CAPABILITY') return 'UNKNOWN';
  if (!candidate.taskAffordanceChecked) return 'LOW';
  if (candidate.productionMode === 'MODELED') return 'LOW';
  if(candidate.productionMode==='INDEPENDENT'&&!productionConditionsAllowIndependentV1(candidate.productionConditions).allowed)return'LOW';
  if (candidate.supportBeforeResponse === 'MODEL' || candidate.supportBeforeResponse === 'EXPLICIT') return 'LOW';
  if (!canonicalTargetRef) return 'MEDIUM';
  if (candidate.confidence === 'HIGH' && candidate.supportBeforeResponse === 'NONE') return 'HIGH';
  return 'MEDIUM';
}

export function buildEvidenceProvenanceV1(
  candidate: EvidenceCandidateV3,
  canonicalTargetRef?: string,
): EvidenceProvenanceV1 {
  return Object.freeze({
    observationId: candidate.observationId,
    artifactId: candidate.artifactId,
    taskId: candidate.taskId ?? undefined,
    episodeId: candidate.episodeId,
    rawTargetRef: candidate.targetRef ?? undefined,
    canonicalTargetRef,
    semanticProvenance: candidate.semanticProvenance,
    productionMode: candidate.productionMode,
    supportBeforeResponse: candidate.supportBeforeResponse,
    contextNovelty: candidate.contextNovelty,
    taskAffordanceChecked: candidate.taskAffordanceChecked,
    opportunityPresent: candidate.opportunityPresent ?? (candidate.candidateKind === 'CAPABILITY' ? true : undefined),
    productionConditions: candidate.productionConditions,
  });
}

export function buildEvidenceUncertaintyV1(candidate: EvidenceCandidateV3): EvidenceUncertaintyV1 {
  const competing = Object.freeze([...candidate.competingExplanations]);
  return Object.freeze({
    classificationConfidence: candidate.confidence,
    competingExplanations: competing,
    unresolved: candidate.confidence !== 'HIGH' || competing.length > 0 || candidate.evidencePolarity === 'UNKNOWN',
  });
}

export function canonicalEvidenceDedupKeyV1(
  learnerId: string,
  candidate: EvidenceCandidateV3,
  canonicalTargetRef?: string,
): string {
  const observationIdentity = candidate.observationId
    ?? [candidate.episodeId, candidate.taskId, candidate.artifactId, candidate.observation].filter(Boolean).join('|')
    ?? candidate.observation;
  return [
    learnerId,
    observationIdentity || candidate.observation,
    candidate.candidateKind,
    canonicalTargetRef ?? candidate.targetRef ?? 'NO_TARGET',
    candidate.capabilityFacet ?? 'NO_FACET',
    candidate.evidencePolarity,
    candidate.productionMode,
    candidate.contextNovelty,
  ].join('::');
}

export function enrichCanonicalEvidenceEventV1(event: CanonicalEvidenceEventV3): CanonicalEvidenceEventV3 {
  const canonicalTargetRef = resolveCanonicalEvidenceTargetV1(event);
  if (event.candidateKind === 'CAPABILITY' && !canonicalTargetRef) throw new Error('canonical capability evidence requires a resolvable English Domain target');
  return Object.freeze({
    ...event,
    canonicalTargetRef,
    targetRef: canonicalTargetRef ?? event.targetRef,
    provenance: buildEvidenceProvenanceV1(event, canonicalTargetRef),
    uncertainty: buildEvidenceUncertaintyV1(event),
    conditionReliability: evidenceConditionReliabilityV1(event, canonicalTargetRef),
    dedupKey: event.dedupKey ?? canonicalEvidenceDedupKeyV1(event.learnerId, event, canonicalTargetRef),
    competingExplanations: Object.freeze([...event.competingExplanations]),
  });
}
