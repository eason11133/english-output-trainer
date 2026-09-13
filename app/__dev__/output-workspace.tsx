import { Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { AllowTeachingSlice } from '../../components/stage5a/AllowTeachingSlice';
import { AdaptiveReviewSeedV4 } from '../../src/application/stage5a/adaptiveOutputWorkspaceRuntime';

const seeds:AdaptiveReviewSeedV4[]=['CORRECT_IMMEDIATELY','VALID_ALTERNATIVE','LEXICAL_RETRIEVAL','TEACHING_SUCCEEDS','TEACHING_CHANGES_REPRESENTATION','COMPOSITION_OVERLOAD','STUCK_BEFORE_ATTEMPT','DELAYED_CHANGED_CONTEXT','ALLOW_ROLE_MAP'];

export default function OutputWorkspaceReviewRoute(){
  const params=useLocalSearchParams<{scenario?:string;reset?:string}>();
  const scenario=seeds.includes(params.scenario as AdaptiveReviewSeedV4)?params.scenario as AdaptiveReviewSeedV4:'ALLOW_ROLE_MAP';
  return <><Stack.Screen options={{headerShown:false}}/><AllowTeachingSlice learnerId={`runtime-review-${scenario}`} forceReset={params.reset==='1'} seed={scenario}/></>;
}
