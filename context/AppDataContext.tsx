import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  applyLearnerProductContextMutationV2,
  canSelectProductExperienceV2,
  createInitialProductProfileV2,
  ProductContextMutationV2,
  ProductExperienceV2,
  ProductProfileV2,
  projectRuntimeProductContextV2,
} from '../src/product';
import { loadProductProfileV2, projectProductContextV1Compatibility, saveProductProfileV2 } from '../src/persistence';
import { initialContextReady, recordFirstDayAction } from '../src/experience/firstDayTutorialState';
import type { TutorialMilestone } from '../src/product/firstDayTutorial';

interface CanonicalProductDataContextV2 {
  ready:boolean;
  initialContextCompleted:boolean;
  recordTutorialAction:(milestone:TutorialMilestone,actionId:string,route:string,learningRoute?:string)=>Promise<void>;
  profile:ProductProfileV2;
  runtimeProductContext:ReturnType<typeof projectRuntimeProductContextV2>;
  learnerPreferences:{learnerId:string;displayName:string;dailyStudyMinutes:number};
  practiceGoals:{onboardingCompleted:boolean;selectedPracticeAreas:string[]};
  learnerTrack:{primaryGoal:string;dailyStudyMinutes:number};
  updateProductContext:(mutation:ProductContextMutationV2)=>Promise<ProductProfileV2>;
  updateLearnerPreferences:(patch:Partial<{displayName:string;dailyStudyMinutes:number}>)=>Promise<void>;
  savePracticeGoalSelection:(goals:{onboardingCompleted:boolean;selectedPracticeAreas:string[]})=>Promise<void>;
  updateLearnerTrack:(patch:Partial<{primaryGoal:string;dailyStudyMinutes:number}>)=>Promise<void>;
  selectProductExperience:(product:ProductExperienceV2)=>Promise<boolean>;
}

const ProductDataContext=createContext<CanonicalProductDataContextV2|null>(null);

function seedForAuth(demoMode:boolean, accountId:string|null, displayName?:string){
  return{
    learnerId:demoMode?'local-learner':accountId??'pending-account',
    accountId:demoMode?null:accountId,
    displayName,
    demoMode,
  } as const;
}

export function AppDataProvider({children}:{children:React.ReactNode}){
  const {loading:authLoading,demoMode,session}=useAuth();
  const [ready,setReady]=useState(false);
  const fallbackProfile=useMemo(()=>createInitialProductProfileV2(seedForAuth(true,null,'Learner'),'1970-01-01T00:00:00.000Z'),[]);
  const [profile,setProfile]=useState<ProductProfileV2>(fallbackProfile);
  const profileRef=useRef<ProductProfileV2>(fallbackProfile);
  const commitQueue=useRef<Promise<unknown>>(Promise.resolve());
  const accountId=session?.user.id??null;
  const authDisplayName=(session?.user.user_metadata?.display_name as string|undefined)??session?.user.email?.split('@')[0];

  useEffect(()=>{
    if(authLoading)return;
    let live=true;
    setReady(false);
    const seed=seedForAuth(demoMode,accountId,authDisplayName);
    void loadProductProfileV2(seed).then(value=>{
      if(!live)return;
      profileRef.current=value;
      setProfile(value);
      setReady(true);
    });
    return()=>{live=false};
  },[accountId,authDisplayName,authLoading,demoMode]);

  function enqueue(mutation:(current:ProductProfileV2)=>ProductContextMutationV2){
    const learnerId=profileRef.current.identity.learnerId;
    const pending=commitQueue.current.then(async()=>{
      const current=profileRef.current;
      if(current.identity.learnerId!==learnerId)throw new Error('Learner changed before profile save');
      const at=new Date(Math.max(Date.now(),(Date.parse(current.updatedAt)||0)+1)).toISOString();
      const next=applyLearnerProductContextMutationV2(current,mutation(current),at);
      await saveProductProfileV2(next);
      if(profileRef.current.identity.learnerId===learnerId){profileRef.current=next;setProfile(next)}
      return next;
    });
    commitQueue.current=pending.catch(()=>undefined);
    return pending;
  }
  function commit(mutation:ProductContextMutationV2){return enqueue(()=>mutation)}

  const value=useMemo<CanonicalProductDataContextV2>(()=>{
    const compatibility=projectProductContextV1Compatibility(profile);
    return{
      ready,
      initialContextCompleted:initialContextReady(profile),
      async recordTutorialAction(milestone,actionId,route,learningRoute){
        if(profileRef.current.onboarding.status==='COMPLETED')return;
        await enqueue(current=>{
          const previous=current.onboarding.firstDay??(current.gsatBeta.coachMarks.opening?{version:1 as const,milestones:{OPENING_COMPLETED:{actionId:'legacy-persisted-opening',occurredAt:current.updatedAt,route:'/onboarding/goals'}}}:undefined);
          const firstDay=recordFirstDayAction(previous,{milestone,actionId,route,learningRoute,occurredAt:new Date().toISOString()});
          return {onboarding:{firstDay,status:milestone==='FIRST_DAY_TUTORIAL_COMPLETED'?'COMPLETED':'IN_PROGRESS',completedAt:milestone==='FIRST_DAY_TUTORIAL_COMPLETED'?new Date().toISOString():undefined}};
        });
      },
      profile,
      runtimeProductContext:projectRuntimeProductContextV2(profile),
      ...compatibility,
      updateProductContext:commit,
      async updateLearnerPreferences(patch){
        await commit({
          identity:patch.displayName===undefined?undefined:{displayName:patch.displayName},
          study:patch.dailyStudyMinutes===undefined?undefined:{dailyStudyMinutes:patch.dailyStudyMinutes},
        });
      },
      async savePracticeGoalSelection(goals){
        await commit({
          goals:{useContexts:goals.selectedPracticeAreas.map(item=>{
            const upper=item.toUpperCase();
            if(upper.includes('TRANSLATION'))return 'TRANSLATION';
            if(upper.includes('READING'))return 'READING';
            if(upper.includes('EXAM'))return 'EXAM_TASKS';
            return 'WRITING';
          })},
          onboarding:{status:goals.onboardingCompleted?'COMPLETED':'IN_PROGRESS',completedAt:goals.onboardingCompleted?new Date().toISOString():undefined},
        });
      },
      async updateLearnerTrack(patch){
        await commit({
          goals:patch.primaryGoal===undefined?undefined:{primaryGoal:patch.primaryGoal},
          study:patch.dailyStudyMinutes===undefined?undefined:{dailyStudyMinutes:patch.dailyStudyMinutes},
        });
      },
      async selectProductExperience(product){
        const current=profileRef.current;
        if(!canSelectProductExperienceV2(current,product))return false;
        await commit({activeExperience:product});
        return true;
      },
    };
  },[profile,ready]);

  return <ProductDataContext.Provider value={value}>{children}</ProductDataContext.Provider>;
}

export function useCanonicalProductData(){
  const value=useContext(ProductDataContext);
  if(!value)throw new Error('AppDataProvider product context not ready');
  return value;
}
export const useAppData=useCanonicalProductData;
