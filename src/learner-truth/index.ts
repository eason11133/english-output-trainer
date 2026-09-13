export type { LearnerTruthPortV1 } from '../architecture/contracts';
export * from '../domain/evidence/CanonicalEvidenceLedgerV3';
export * from '../domain/evidence/EvidenceCandidateV3';
export * from '../application/evidence/commitEvidenceCandidateV3';
export * from '../application/evidence/evidenceGuardsV3';
export * from '../application/learner/projectLearnerModelV3';
export * from './observation';
export * from './observationLedger';
export * from './lexicalEncounter';
export * from './evidenceSemantics';
export * from './projection';
export * from './service';
export * from './waveCStatus';

export const LEARNER_TRUTH_AUTHORITY = 'Immutable guarded evidence is truth; learner state is a projection.' as const;
