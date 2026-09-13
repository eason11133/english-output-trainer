import type { ProductContextV1 } from '../architecture/contracts';
import { ProductProfileV2 } from './types';

export function projectRuntimeProductContextV2(profile: ProductProfileV2): ProductContextV1 {
  const mode = profile.access.activeExperience;
  const entitlement=profile.access.entitlements[mode];
  return {
    learnerId: profile.identity.learnerId,
    goals: [profile.goals.primaryGoal],
    learningPurpose:profile.goals.learningPurpose,
    useContexts:profile.goals.useContexts,
    currentPriority:profile.goals.currentPriority.kind==='NONE'?undefined:profile.goals.currentPriority.kind,
    studyMinutes: profile.study.preferredSessionMinutes,
    productMode: mode,
    entitlement:{status:entitlement.status,source:entitlement.source,planId:entitlement.planId},
    examContext: mode === 'EXAM' ? {
      examType:profile.exam.examType||undefined,
      scope: profile.exam.scope || profile.exam.examType || '未設定考試範圍',
      deadline: profile.exam.deadline,
      rubric: profile.exam.rubric,
      targetScore:profile.exam.targetScore,
      schedulingResults:profile.gsatBeta.recentResults,
    } : undefined,
  };
}
