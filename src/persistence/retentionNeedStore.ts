import type { DurableRetentionNeedV1,DurableRetentionStoreV1 } from '../longitudinal';
import { fingerprintV1 } from './identity';
import { operationalDatabaseV1 } from './operationalDatabase';
const db=operationalDatabaseV1 as typeof operationalDatabaseV1&{listRetentionNeeds(learnerId:string):Promise<readonly DurableRetentionNeedV1[]>};
export const operationalRetentionNeedStoreV1:DurableRetentionStoreV1=Object.freeze({async save(need:DurableRetentionNeedV1){const inputFingerprint=await fingerprintV1(need),result=await db.commitRetentionNeed({envelope:{operationId:`retention:${need.needId}:${need.updatedAt}`,learnerId:need.learnerId,occurredAt:need.updatedAt,inputFingerprint,correlationId:need.needId},need});return result.status==='IDEMPOTENT_REPLAY'?'IDEMPOTENT_REPLAY':'COMMITTED'},load(learnerId:string){return db.listRetentionNeeds(learnerId)}});
