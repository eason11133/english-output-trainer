import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  createInitialProductProfileV2,
  migrateLegacyProductContextV1ToV2,
  normalizeProductProfileV2,
  onboardingIsCompleteV2,
  ProductIdentitySeedV2,
  ProductProfileV2,
  type LegacyProductContextV1,
} from '../product';
import { migrateU1AsyncStorageV1 } from './asyncStorageMigration';
import { fingerprintV1 } from './identity';
import { operationalDatabaseV1 } from './operationalDatabase';

const KEY_PREFIX = 'eot.product-context.v2';
const LEGACY_KEY = 'eot.teacher-core.profile.v1';

export function productContextStorageKeyV2(learnerId:string){
  return `${KEY_PREFIX}:${learnerId}`;
}

function parseJSON<T>(raw:string|null):T|undefined{
  if(!raw)return undefined;
  try{return JSON.parse(raw) as T}catch{return undefined}
}

export async function loadProductProfileV2(seed:ProductIdentitySeedV2):Promise<ProductProfileV2>{
  const now=new Date().toISOString();
  const key=productContextStorageKeyV2(seed.learnerId);
  if(Platform.OS!=='web'){
    await migrateU1AsyncStorageV1(seed.learnerId);
    const local=await operationalDatabaseV1.getProductProfile(seed.learnerId) as ProductProfileV2|null;
    if(local?.schemaVersion===2)return normalizeProductProfileV2(local,seed,now);
  }
  const stored=parseJSON<ProductProfileV2>(await AsyncStorage.getItem(key));
  if(stored?.schemaVersion===2)return normalizeProductProfileV2(stored,seed,now);

  // The old product context used one global key. Only the local/demo learner is
  // eligible for that migration, so authenticated accounts can never inherit
  // another learner's local preferences.
  if(seed.demoMode){
    const legacy=parseJSON<LegacyProductContextV1>(await AsyncStorage.getItem(LEGACY_KEY));
    if(legacy){
      const migrated=normalizeProductProfileV2(migrateLegacyProductContextV1ToV2(legacy,seed,now),seed,now);
      await saveProductProfileV2(migrated);
      return migrated;
    }
  }

  const initial=createInitialProductProfileV2(seed,now);
  await saveProductProfileV2(initial);
  return initial;
}

export async function saveProductProfileV2(profile:ProductProfileV2):Promise<void>{
  if(Platform.OS!=='web'){
    const occurredAt=profile.updatedAt;
    await operationalDatabaseV1.commitProductMutation({envelope:{operationId:`profile:${profile.identity.learnerId}:${profile.updatedAt}`,learnerId:profile.identity.learnerId,occurredAt,inputFingerprint:await fingerprintV1(profile)},profile});
    return;
  }
  await AsyncStorage.setItem(productContextStorageKeyV2(profile.identity.learnerId),JSON.stringify(profile));
}

export async function removeProductProfileV2(learnerId:string):Promise<void>{
  await AsyncStorage.removeItem(productContextStorageKeyV2(learnerId));
}

// Compatibility projection retained for older callers outside the product
// subsystem. It is not a second source of truth and is never separately saved.
export interface ProductContextSnapshotV1 {
  learnerPreferences:{learnerId:string;displayName:string;dailyStudyMinutes:number};
  practiceGoals:{onboardingCompleted:boolean;selectedPracticeAreas:string[]};
  learnerTrack:{primaryGoal:string;dailyStudyMinutes:number};
}
export const initialProductContextV1:ProductContextSnapshotV1={
  learnerPreferences:{learnerId:'local-learner',displayName:'Learner',dailyStudyMinutes:10},
  practiceGoals:{onboardingCompleted:false,selectedPracticeAreas:['writing_output']},
  learnerTrack:{primaryGoal:'把學過的英文變成能自己正確產出的英文',dailyStudyMinutes:10},
};
export function projectProductContextV1Compatibility(profile:ProductProfileV2):ProductContextSnapshotV1{
  return{
    learnerPreferences:{learnerId:profile.identity.learnerId,displayName:profile.identity.displayName,dailyStudyMinutes:profile.study.dailyStudyMinutes},
    practiceGoals:{onboardingCompleted:onboardingIsCompleteV2(profile),selectedPracticeAreas:profile.goals.useContexts.map(item=>item.toLowerCase())},
    learnerTrack:{primaryGoal:profile.goals.primaryGoal,dailyStudyMinutes:profile.study.dailyStudyMinutes},
  };
}
