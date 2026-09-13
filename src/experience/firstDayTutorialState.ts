import type { FirstDayTutorialState, TutorialMilestone } from '../product/firstDayTutorial';
import type { ProductProfileV2 } from '../product/types';
export type TutorialScene = 'OPENING' | 'INITIAL_CONTEXT' | 'TODAY' | 'LEARNING' | 'TEACHER' | 'RESULT' | 'MY_ENGLISH' | 'PRACTICE' | 'RETURN_TODAY' | 'DONE';
const ordered: readonly TutorialMilestone[] = ['OPENING_COMPLETED','INITIAL_CONTEXT_COMPLETED','TODAY_STARTED','FIRST_MICRO_ACTION_COMPLETED','FIRST_TEACHER_REPAIR_COMPLETED','FIRST_SUPPORT_FADE_COMPLETED','FIRST_FRESH_ATTEMPT_COMPLETED','FIRST_RESULT_SEEN','MY_ENGLISH_EXPLAINED_FROM_REAL_CHANGE','PRACTICE_VISITED','RETURNED_TO_TODAY','FIRST_DAY_TUTORIAL_COMPLETED'];
const scenes: readonly TutorialScene[] = ['OPENING','INITIAL_CONTEXT','TODAY','LEARNING','TEACHER','TEACHER','TEACHER','RESULT','MY_ENGLISH','PRACTICE','RETURN_TODAY','RETURN_TODAY'];
export function nextTutorialScene(state: FirstDayTutorialState): TutorialScene {
  const index=ordered.findIndex(key=>!state.milestones[key]);
  return index<0?'DONE':scenes[index];
}
export function firstDayActive(profile: ProductProfileV2) {
  return profile.onboarding.status!=='COMPLETED';
}
export function initialContextReady(profile: ProductProfileV2) {
  return profile.onboarding.status==='COMPLETED'||Boolean(profile.onboarding.firstDay?.milestones.INITIAL_CONTEXT_COMPLETED);
}
export function firstDayResumeRoute(profile: ProductProfileV2): string {
  if(!firstDayActive(profile))return '/(tabs)';
  if(!profile.onboarding.firstDay?.milestones.TODAY_STARTED){
    const setupRoute={DATE:'/onboarding/date',TIME:'/onboarding/time',SIGNAL:'/onboarding/signal',MOCK_SCORE:'/onboarding/exam',QUICK_DIAG:'/quick-calibration',HANDOFF:'/onboarding/handoff'} as const;
    const route=profile.onboarding.setupStage&&setupRoute[profile.onboarding.setupStage as keyof typeof setupRoute];
    if(route)return route;
  }
  const state=profile.onboarding.firstDay;
  if(!state)return profile.gsatBeta.hasRecentMock==='UNKNOWN'?'/onboarding/goals':'/onboarding/time';
  switch(nextTutorialScene(state)) {
    case 'OPENING': return '/onboarding/goals';
    case 'INITIAL_CONTEXT': return profile.gsatBeta.hasRecentMock==='UNKNOWN'?'/onboarding/goals':'/onboarding/time';
    case 'LEARNING': case 'TEACHER': return state.learningRoute??'/(tabs)';
    case 'RESULT': return '/result';
    case 'MY_ENGLISH': return '/(tabs)/my-english';
    case 'PRACTICE': return '/(tabs)/practice';
    default: return '/(tabs)';
  }
}

/** Called after the corresponding production action has succeeded, never by coach dismissal. */
export function recordFirstDayAction(state: FirstDayTutorialState|undefined, input: {
  milestone: TutorialMilestone; actionId: string; route: string; occurredAt: string; learningRoute?: string;
}): FirstDayTutorialState {
  const current=state??{version:1 as const,milestones:{}};
  if(current.milestones[input.milestone])return current;
  if(!input.actionId.trim()||!input.route.startsWith('/'))throw new Error('Tutorial requires a production action receipt');
  const index=ordered.indexOf(input.milestone);
  const prerequisites=input.milestone==='FIRST_LOOKUP_USED'?['TODAY_STARTED'] as const:ordered.slice(0,index);
  if(prerequisites.some(key=>!current.milestones[key]))throw new Error(`Unfinished tutorial prerequisites: ${input.milestone}`);
  return {...current,...(input.learningRoute?{learningRoute:input.learningRoute}:{}),milestones:{...current.milestones,[input.milestone]:{actionId:input.actionId,route:input.route,occurredAt:input.occurredAt}}};
}
