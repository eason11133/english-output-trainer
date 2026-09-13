export const waveU1CapabilityStatusV1=Object.freeze([
  ['U.local-persistence',15,85,'Expo SQLite native kernel; web remains on bounded legacy adapters'],
  ['U.server-truth',10,10,'Explicitly deferred to U2'],
  ['U.sync',0,0,'Explicitly deferred to U2'],
  ['U.db-schema',10,90,'29-table bounded operational schema with typed authority fields'],
  ['U.migration',10,80,'Versioned idempotent AsyncStorage migration with quarantine'],
  ['U.backup-restore',0,0,'Deferred; no key custody or product contract'],
  ['U.file-storage',10,80,'App-owned content-addressed object storage on native'],
  ['U.artifact-storage',10,85,'Durable page objects and immutable learner version boundary'],
  ['U.event-ledger',25,85,'Transactional evidence and Teacher/Experience lineage'],
  ['U.user-deletion',0,70,'Learner cascade plus orphan-object integrity; account/cloud deletion deferred'],
  ['U.privacy-boundary',20,75,'Learner-scoped rows and bounded read ports'],
  ['U.cross-device',0,0,'Explicitly deferred to U2'],
] as const);
export const WAVE_U1_STATUS='PARTIAL' as const;
