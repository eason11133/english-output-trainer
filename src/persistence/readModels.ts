import { Platform } from 'react-native';
import type { CanonicalEvidenceEventV3 } from '../domain/evidence/EvidenceCandidateV3';
import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { AsyncStorageCanonicalEvidenceLedgerV3 } from '../repositories/AsyncStorageCanonicalEvidenceLedgerV3';
import { listStage4RuntimesV4, loadActiveStage4RuntimeV4 } from '../repositories/Stage4RuntimeStorage';
import { operationalDatabaseV1 } from './operationalDatabase';

export interface OperationalHistoryReadPortV1 {
  canonicalEvidence(learnerId:string):Promise<readonly CanonicalEvidenceEventV3[]>;
  sessions(learnerId:string):Promise<readonly Stage4RuntimeV4[]>;
  activeSession(learnerId:string):Promise<Stage4RuntimeV4|null>;
  teacherContextInputs(learnerId:string,lessonPlanId:string):Promise<Readonly<Record<string,unknown>>>;
}
const legacyEvidence=new AsyncStorageCanonicalEvidenceLedgerV3();
export const operationalHistoryReadPortV1:OperationalHistoryReadPortV1=Object.freeze({
  canonicalEvidence(learnerId:string){return Platform.OS==='web'?legacyEvidence.listForLearner(learnerId):operationalDatabaseV1.listCanonicalEvidence(learnerId)},
  sessions:async (learnerId:string)=>Platform.OS==='web'?(await listStage4RuntimesV4()).filter(item=>item.learnerId===learnerId):operationalDatabaseV1.listSessions(learnerId),
  activeSession:(learnerId:string)=>Platform.OS==='web'?loadActiveStage4RuntimeV4(learnerId):operationalDatabaseV1.loadActiveSession(learnerId),
  teacherContextInputs:(learnerId:string,lessonPlanId:string,targetRef?:string,facet?:string)=>operationalDatabaseV1.loadTeacherContextInputs(learnerId,lessonPlanId,targetRef,facet),
});
