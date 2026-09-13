import { EntitlementStatusV2, ProductExperienceV2, ProductProfileV2 } from './types';

export type ProductExperienceAccessDecisionV2 = 'FULL' | 'PREVIEW' | 'BLOCKED';

export function entitlementAllowsFullUseV2(status: EntitlementStatusV2) {
  return status === 'ACTIVE' || status === 'TRIAL' || status === 'DEVELOPMENT';
}

export function productExperienceAccessDecisionV2(profile: ProductProfileV2, product: ProductExperienceV2): ProductExperienceAccessDecisionV2 {
  const entitlement = profile.access.entitlements[product];
  if (entitlementAllowsFullUseV2(entitlement.status)) return 'FULL';
  if (entitlement.status === 'UNKNOWN' || profile.access.trials[product].state === 'AVAILABLE') return 'PREVIEW';
  return 'BLOCKED';
}

export function canSelectProductExperienceV2(profile: ProductProfileV2, product: ProductExperienceV2) {
  return productExperienceAccessDecisionV2(profile, product) !== 'BLOCKED';
}

export function accessLabelZhTwV2(profile: ProductProfileV2, product: ProductExperienceV2) {
  const decision = productExperienceAccessDecisionV2(profile, product);
  if (decision === 'FULL') {
    const status = profile.access.entitlements[product].status;
    if (status === 'DEVELOPMENT') return '開發存取';
    if (status === 'TRIAL') return '試用中';
    return '已開通';
  }
  if (decision === 'PREVIEW') return '可預覽';
  return '尚未開通';
}
