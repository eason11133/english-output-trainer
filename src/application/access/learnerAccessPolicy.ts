export type LearnerAccessInput = { authenticated: boolean; onboardingCompleted: boolean };
export type LearnerAccessDecision = 'SIGN_IN' | 'ONBOARDING' | 'TODAY';

/** Authentication and the lightweight first-run setup are the only global route gates. */
export function decideLearnerAccess(input: LearnerAccessInput): LearnerAccessDecision {
  if (!input.authenticated) return 'SIGN_IN';
  return input.onboardingCompleted ? 'TODAY' : 'ONBOARDING';
}

export type GlobalRouteDecision = 'ALLOW' | 'SIGN_IN' | 'ONBOARDING' | 'TODAY';
const protectedRoots = new Set(['(tabs)', 'daily-lesson', 'reading-attempt', 'exam-practice', 'learning-foundation-v01', 'quick-calibration', 'result', 'profile', 'settings']);
export function decideGlobalRouteAccess(input: LearnerAccessInput & { segments: readonly string[]; dev?: boolean }): GlobalRouteDecision {
  const [root] = input.segments;
  if (root === '__dev__') return input.dev === false ? 'TODAY' : 'ALLOW';
  if (root === 'learning-foundation-v01' && input.dev !== false) return 'ALLOW';
  if (root === undefined || root === 'index') return 'ALLOW';
  if (root === '(auth)') return input.authenticated ? (input.onboardingCompleted ? 'TODAY' : 'ONBOARDING') : 'ALLOW';
  if (!input.authenticated) return 'SIGN_IN';
  if (root === 'onboarding') return 'ALLOW';
  if (!input.onboardingCompleted) return 'ONBOARDING';
  if (protectedRoots.has(root)) return 'ALLOW';
  return 'TODAY';
}
