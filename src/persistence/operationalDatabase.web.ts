import type { OperationalCommandPortV1 } from './operationalTypes';

const unavailable=async():Promise<never>=>{throw new Error('u1_native_sqlite_unavailable_on_web_use_legacy_adapter')};
export const operationalDatabaseV1:OperationalCommandPortV1&{initialize():Promise<void>;loadActiveSession(learnerId:string):Promise<null>;loadActiveSessionBundle(learnerId:string):Promise<null>;loadSessionBundleById(learnerId:string,sessionId:string):Promise<null>;listSessions(learnerId:string):Promise<readonly never[]>;listCanonicalEvidence(learnerId:string):Promise<readonly never[]>;listRetentionNeeds(learnerId:string):Promise<readonly never[]>;loadTeacherContextInputs(learnerId:string,lessonPlanId:string,targetRef?:string,facet?:string):Promise<Readonly<Record<string,unknown>>>}={
  initialize:async()=>{},
  commitProductMutation:unavailable,
  commitArtifactIntake:unavailable,
  commitSessionCheckpoint:unavailable,
  commitEvidenceChain:unavailable,
  commitTeacherLineage:unavailable,
  commitRetentionNeed:unavailable,
  deleteLearnerOperationalData:unavailable,
  loadActiveSession:async()=>null,
  loadActiveSessionBundle:async()=>null,
  loadSessionBundleById:async()=>null,
  listSessions:async()=>[],
  listCanonicalEvidence:async()=>[],
  listRetentionNeeds:async()=>[],
  loadTeacherContextInputs:async()=>({limitation:'native_sqlite_unavailable_on_web'}),
};
