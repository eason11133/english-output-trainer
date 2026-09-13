import { CanonicalEvidenceEventV3 } from '../domain/evidence/EvidenceCandidateV3';
import {
  CapabilityProjection,
  CapabilityState,
  CompetingHypothesisProjectionV1,
  LearnerModelSnapshotV3,
  ProjectionUncertaintyV1,
} from '../domain/learner/LearnerModelV3';
import { ExposureEvent } from '../domain/learner/ExposureEvent';
import { enrichCanonicalEvidenceEventV1 } from './evidenceSemantics';

// Pre-dimension historical evidence was production-oriented. New recognition
// tasks must opt in explicitly; inferring recognition from a shared facet would
// silently reclassify founder history during migration.
const dimensionFor=(event:CanonicalEvidenceEventV3)=>event.performanceDimension??'PRODUCTION';
const opportunityKey=(event:CanonicalEvidenceEventV3)=>[
  event.canonicalTargetRef??event.targetRef,event.capabilityFacet,event.senseId??'',dimensionFor(event),
  event.performanceDimension?(event.taskId??event.provenance?.taskId??event.id):(event.dedupKey??event.id),event.contextNovelty,
].join('::');
/** Projection-only sampling: ledger events remain immutable and complete. Latest observation wins per stable opportunity. */
const distinctOpportunities=(events:readonly CanonicalEvidenceEventV3[])=>[
  ...new Map(events.map(event=>[opportunityKey(event),event])).values(),
];

const confidenceFromEvidence = (events: readonly CanonicalEvidenceEventV3[]) => {
  const high = events.filter(event => event.confidence === 'HIGH').length;
  if (high >= 2) return 'HIGH' as const;
  if (events.length >= 2) return 'MEDIUM' as const;
  return 'LOW' as const;
};

const conditionReliability = (events: readonly CanonicalEvidenceEventV3[]) => {
  const enriched = events.map(enrichCanonicalEvidenceEventV1);
  if (enriched.some(event => event.conditionReliability === 'HIGH')) return 'HIGH' as const;
  if (enriched.some(event => event.conditionReliability === 'MEDIUM')) return 'MEDIUM' as const;
  if (enriched.some(event => event.conditionReliability === 'LOW')) return 'LOW' as const;
  return 'UNKNOWN' as const;
};

function uncertaintyFor(events: readonly CanonicalEvidenceEventV3[]): ProjectionUncertaintyV1 {
  const enriched = events.map(enrichCanonicalEvidenceEventV1);
  const qualifying = enriched.filter(event => ['POSITIVE', 'NEGATIVE'].includes(event.evidencePolarity));
  const hasPositive = qualifying.some(event => event.evidencePolarity === 'POSITIVE');
  const hasNegative = qualifying.some(event => event.evidencePolarity === 'NEGATIVE');
  const hasCompeting = enriched.some(event => (event.uncertainty?.competingExplanations.length ?? 0) > 0);
  const hasLow = enriched.some(event => event.conditionReliability === 'LOW' || event.confidence === 'LOW');
  const level: ProjectionUncertaintyV1['level'] =
    hasPositive && hasNegative ? 'HIGH'
      : hasCompeting || hasLow || qualifying.length < 2 ? 'MEDIUM'
        : 'LOW';
  const reasons = [
    ...(hasPositive && hasNegative ? ['conflicting positive and negative evidence'] : []),
    ...(hasCompeting ? ['competing explanations remain'] : []),
    ...(hasLow ? ['some evidence has low condition reliability'] : []),
    ...(qualifying.length < 2 ? ['limited evidence volume'] : []),
  ];
  return { level, reasons: Object.freeze(reasons) };
}

function hypothesesFor(events: readonly CanonicalEvidenceEventV3[]): readonly CompetingHypothesisProjectionV1[] {
  const enriched = events.map(enrichCanonicalEvidenceEventV1);
  const ids = enriched.map(event => event.id);
  const positive = enriched.filter(event => event.evidencePolarity === 'POSITIVE');
  const negative = enriched.filter(event => event.evidencePolarity === 'NEGATIVE');
  const assisted = positive.filter(event => event.productionMode !== 'INDEPENDENT');
  const independent = positive.filter(event => event.productionMode === 'INDEPENDENT');
  const map = new Map<string, CompetingHypothesisProjectionV1>();

  const add = (id: string, label: string, status: CompetingHypothesisProjectionV1['status'], sourceEvidenceIds = ids) => {
    map.set(id, { id, label, status, sourceEvidenceIds: Object.freeze([...sourceEvidenceIds]) });
  };

  if (assisted.length && !independent.length) {
    add('support-dependent-control', '目前可能需要支援才能穩定產出', 'SUPPORTED', assisted.map(event => event.id));
    add('independent-control', '已能完全獨立產出', 'UNRESOLVED', assisted.map(event => event.id));
  }
  if (positive.length && negative.length) {
    add('condition-dependent-fragility', '表現可能受情境、負荷或提取狀態影響', 'SUPPORTED');
    add('stable-global-gap', '在所有情況下都不會', 'WEAKENED');
  } else if (negative.length && !positive.length) {
    add('observed-gap', '目前觀察到這個能力尚未穩定控制', 'POSSIBLE', negative.map(event => event.id));
  }
  for (const event of enriched) {
    for (const explanation of event.competingExplanations) {
      const key = `candidate:${explanation.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      if (!map.has(key)) add(key, explanation, 'POSSIBLE', [event.id]);
    }
  }
  return Object.freeze([...map.values()]);
}

function supportDependenceFor(events: readonly CanonicalEvidenceEventV3[]): CapabilityProjection['supportDependence'] {
  const recent = events
    .filter(event => event.evidencePolarity === 'POSITIVE' && event.productionMode !== 'NOT_PRODUCTION')
    .slice(-5);
  if (!recent.length) return 'UNKNOWN';
  const independent = recent.filter(event => event.productionMode === 'INDEPENDENT').length;
  const assisted = recent.length - independent;
  if (!independent && assisted) return 'HIGH';
  if (independent && assisted >= independent) return 'MEDIUM';
  if (assisted) return 'LOW';
  return 'NONE_OBSERVED';
}

function projectCapability(events: readonly CanonicalEvidenceEventV3[]): CapabilityProjection {
  const enriched = distinctOpportunities(events.map(enrichCanonicalEvidenceEventV1));
  const latest = enriched.at(-1)!;
  const positives = enriched.filter(event => event.evidencePolarity === 'POSITIVE' && event.confidence !== 'LOW');
  const negatives = enriched.filter(event =>
    event.evidencePolarity === 'NEGATIVE'
    && event.confidence !== 'LOW'
    && event.opportunityPresent !== false,
  );
  const independent = positives.filter(event => event.productionMode === 'INDEPENDENT' && event.supportBeforeResponse === 'NONE');
  const assisted = positives.filter(event => ['CUED', 'GUIDED', 'MODELED'].includes(event.productionMode));
  const sourceIndependent = independent.filter(event => event.contextNovelty === 'SOURCE' || event.contextNovelty === 'SAME_CONTEXT');
  const transfer = independent.filter(event => event.contextNovelty === 'CHANGED_CONTEXT' || event.contextNovelty === 'DELAYED_CONTEXT');
  const retention = independent.filter(event => event.contextNovelty === 'DELAYED_CONTEXT');

  let state: CapabilityState = 'UNKNOWN';
  if (negatives.length) state = 'OBSERVED_FRAGILE';
  if (assisted.length) state = 'ASSISTED_CONTROL';
  if (sourceIndependent.length) state = 'INDEPENDENT_LOCAL_CONTROL';
  if (sourceIndependent.length && !transfer.length) state = 'TRANSFER_PENDING';
  if (transfer.length) state = 'TRANSFER_SUPPORTED';
  if (transfer.length && !retention.length) state = 'RETENTION_PENDING';
  if (retention.length) state = 'RETENTION_SUPPORTED';

  const recentQualifying = enriched
    .filter(event => ['POSITIVE', 'NEGATIVE'].includes(event.evidencePolarity) && event.confidence !== 'LOW')
    .slice(-3);
  const recentNegativeCount = recentQualifying.filter(event => event.evidencePolarity === 'NEGATIVE').length;
  if (state !== 'UNKNOWN' && recentNegativeCount >= 2) state = 'OBSERVED_FRAGILE';
  const historicalIndependentControl=independent.length>0;
  const currentAvailability=historicalIndependentControl&&recentNegativeCount>=1?'WEAKENING':historicalIndependentControl?'AVAILABLE':assisted.length?'SUPPORTED':'UNSEEN';

  return {
    targetRef: latest.canonicalTargetRef ?? latest.targetRef!,
    facet: latest.capabilityFacet!,
    senseId: latest.senseId,
    performanceDimension: dimensionFor(latest),
    state,
    confidence: confidenceFromEvidence(enriched),
    supportDependence: supportDependenceFor(enriched),
    sourceEvidenceIds: enriched.map(event => event.id),
    sourceControl: sourceIndependent.length > 0,
    transferSupport: transfer.length > 0,
    retentionSupport: retention.length > 0,
    uncertainty: uncertaintyFor(enriched),
    hypotheses: hypothesesFor(enriched),
    conditionReliability: conditionReliability(enriched),
    latestEvidenceAt: latest.occurredAt,
    historicalIndependentControl,
    currentAvailability,
  };
}

export function projectCanonicalLearnerTruthV1(
  learnerId: string,
  events: readonly CanonicalEvidenceEventV3[],
  goalContext: Record<string, unknown> = {},
  exposures: readonly ExposureEvent[] = [],
): LearnerModelSnapshotV3 {
  const ordered = [...events]
    .filter(event => event.learnerId === learnerId)
    .map(enrichCanonicalEvidenceEventV1)
    .sort((left, right) => left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id));

  const groups = new Map<string, CanonicalEvidenceEventV3[]>();
  for (const event of ordered) {
    const target = event.canonicalTargetRef ?? event.targetRef;
    if (!target || !event.capabilityFacet) continue;
    const key = `${target}::${event.capabilityFacet}::${event.senseId??''}::${dimensionFor(event)}`;
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }

  const interaction = new Map<string, { helped: number; noProgress: number; confused: number; ids: string[]; domain: string }>();
  for (const event of ordered.filter(event => event.candidateKind === 'RESPONSIVENESS')) {
    const strategy = event.targetRef ?? 'UNKNOWN';
    const value = interaction.get(strategy) ?? { helped: 0, noProgress: 0, confused: 0, ids: [], domain: event.capabilityDomain ?? 'OTHER' };
    if (event.evidencePolarity === 'POSITIVE') value.helped++;
    else if (/confus/i.test(event.observation)) value.confused++;
    else value.noProgress++;
    value.ids.push(event.id);
    interaction.set(strategy, value);
  }

  const exposureGroups = new Map<string, ExposureEvent[]>();
  for (const exposure of exposures.filter(exposure => exposure.learnerId === learnerId)) {
    const key = `${exposure.targetRef}::${exposure.kind}`;
    exposureGroups.set(key, [...(exposureGroups.get(key) ?? []), exposure]);
  }

  return {
    learnerId,
    generatedFromEvidenceIds: ordered.map(event => event.id),
    capabilitySlice: [...groups.values()].map(projectCapability),
    interactionSlice: [...interaction.entries()].map(([strategy, value]) => ({
      strategy,
      domain: value.domain,
      helped: value.helped,
      noProgress: value.noProgress,
      confused: value.confused,
      confidence: value.ids.length >= 3 ? 'HIGH' : value.ids.length >= 2 ? 'MEDIUM' : 'LOW',
      sourceEvidenceIds: value.ids,
    })),
    exposureSlice: [...exposureGroups.values()].map(group => ({
      targetRef: group[0].targetRef,
      kind: group[0].kind,
      count: group.length,
      sourceEvidenceIds: group.map(item => item.id),
      isCapabilityEvidence: false as const,
    })),
    goalContext,
    projectionVersion: 1,
  };
}
