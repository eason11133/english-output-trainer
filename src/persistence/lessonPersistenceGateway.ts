import { createCanonicalLearnerTruthPortV1 } from '../learner-truth';
import { CanonicalLexicalEncounterStoreV1 } from '../learner-truth/lexicalEncounter';
import { AsyncStorageCanonicalEvidenceLedgerV3 } from '../repositories/AsyncStorageCanonicalEvidenceLedgerV3';
import { AsyncStorageCanonicalObservationLedgerV1 } from '../repositories/AsyncStorageCanonicalObservationLedgerV1';
import { Platform } from 'react-native';
import type { LessonPlanV1 } from '../architecture/contracts';
import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
import { fingerprintV1 } from './identity';
import { operationalDatabaseV1 } from './operationalDatabase';
import { loadActiveStage4RuntimeV4, saveStage4RuntimeV4 } from '../repositories/Stage4RuntimeStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
const planKey=(learnerId:string)=>`eot:active-lesson-plan:v1:${learnerId}`;

export {
  appendOriginalArtifactV4,
  listStage4RuntimesV4,
  loadActiveStage4RuntimeV4,
  saveStage4RuntimeV4,
} from '../repositories/Stage4RuntimeStorage';

export const canonicalEvidenceLedgerV1 = new AsyncStorageCanonicalEvidenceLedgerV3();
export const canonicalObservationLedgerV1 = new AsyncStorageCanonicalObservationLedgerV1();
export const canonicalLexicalEncounterStoreV1 = new CanonicalLexicalEncounterStoreV1(canonicalObservationLedgerV1);
export const canonicalLearnerTruthV1 = createCanonicalLearnerTruthPortV1({
  evidenceLedger: canonicalEvidenceLedgerV1,
  observationLedger: canonicalObservationLedgerV1,
});

export async function saveOperationalLessonCheckpointV1(lessonPlan:LessonPlanV1,runtime:Stage4RuntimeV4){
  if(Platform.OS==='web'){await AsyncStorage.setItem(planKey(runtime.learnerId),JSON.stringify(lessonPlan));return saveStage4RuntimeV4(runtime)}
  const occurredAt=runtime.trace.at(-1)?.occurredAt??new Date().toISOString();
  const logicalStep=runtime.trace.at(-1)?.id??`${runtime.status}:${runtime.blockEvents.length}:${runtime.observations.length}`;
  const value={lessonPlan,runtime};
  return operationalDatabaseV1.commitSessionCheckpoint({envelope:{operationId:`session:${runtime.id}:${logicalStep}`,learnerId:runtime.learnerId,occurredAt,inputFingerprint:await fingerprintV1(value),correlationId:runtime.id},lessonPlan,runtime});
}
export async function loadActiveOperationalLessonBundleV1(learnerId:string):Promise<{runtime:Stage4RuntimeV4;lessonPlan:LessonPlanV1}|null>{if(Platform.OS==='web'){const[runtime,rawPlan]=await Promise.all([loadActiveStage4RuntimeV4(learnerId),AsyncStorage.getItem(planKey(learnerId))]);return runtime&&rawPlan?{runtime,lessonPlan:JSON.parse(rawPlan) as LessonPlanV1}:null}return (operationalDatabaseV1 as typeof operationalDatabaseV1&{loadActiveSessionBundle(id:string):Promise<{runtime:Stage4RuntimeV4;lessonPlan:LessonPlanV1}|null>}).loadActiveSessionBundle(learnerId)}
export async function loadActiveOperationalLessonV1(learnerId:string):Promise<Stage4RuntimeV4|null>{
  if(Platform.OS==='web')return loadActiveStage4RuntimeV4(learnerId);
  return operationalDatabaseV1.loadActiveSession(learnerId) as Promise<Stage4RuntimeV4|null>;
}
