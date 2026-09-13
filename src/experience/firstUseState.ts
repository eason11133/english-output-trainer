import type{ProductProfileV2}from'../product';
export function needsFirstLaunchIntroV1(profile:ProductProfileV2){return profile.onboarding.status!=='COMPLETED'&&!profile.gsatBeta.coachMarks.opening&&!profile.onboarding.firstDay?.milestones.OPENING_COMPLETED}
