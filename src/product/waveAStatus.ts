export interface ProductWaveACapabilityStatusV1 {
  capabilityId:string;
  beforePercent:number;
  afterPercent:number;
  problem:string;
  rootCause:string;
  upgrade:string;
  dependency:string;
  acceptance:string;
  auditAdjusted?:boolean;
}

const rows = [
  ['A.identity',25,85,'Identity was a local string detached from account truth.','Legacy preference storage doubled as identity.','Versioned identity binds demo/account identity without touching learner capability truth.','Auth + persistence','Stable learnerId/accountId/displayName survive reload and migrate legacy data.'],
  ['A.goals',30,90,'A single hard-coded goal could not represent current intent.','Onboarding wrote fixed strings.','Canonical primary goal with editable product context and provenance.','Experience','Goal is learner-editable, persisted, and projected to runtime.'],
  ['A.learning-purpose',10,90,'Purpose was implicit.','No typed product-context model.','Typed learning-purpose field drives onboarding and experience context.','UX + curriculum later','Purpose persists and can distinguish exam/general contexts.'],
  ['A.use-context',20,90,'Practice areas were mistaken for use context.','Legacy module-centric model.','Real-use context inventory separated from capability/mastery.','UX + curriculum later','At least one use context is collected and persisted.'],
  ['A.current-priority',0,85,'No safe learner override existed.','No canonical product context.','Explicit priority override with provenance and clear/reset support.','Curriculum later','Priority is learner-owned context, not learner-state evidence.'],
  ['A.study-time',45,92,'Daily minutes existed in duplicate structures.','Preference and track both owned the same fact.','Single canonical study context with normalization.','Today/curriculum','One persisted daily-time source remains.'],
  ['A.session-duration',10,92,'Lesson duration was conflated with daily time.','No separate time architecture input.','Preferred session duration is first-class and normalized.','Lesson runtime/curriculum','Runtime projection consumes preferred session minutes.'],
  ['A.general-entitlement',5,78,'General access had no canonical truth.','Commercial context was postponed/legacy.','Typed entitlement with honest DEVELOPMENT/UNKNOWN/ACTIVE/TRIAL states.','Backend entitlement service later','No paid access is fabricated; full/preview/blocked is deterministic.'],
  ['A.exam-entitlement',5,78,'Exam access had no canonical truth.','General/Exam separation was not implemented in context.','Independent Exam entitlement shares the same learner identity/history.','Backend entitlement service later','Exam access never forks learner truth.'],
  ['A.exam-scope',10,88,'Exam scope was missing or free-floating.','Legacy track was too shallow.','Dedicated exam context with editable scope.','Exam policy later','Scope persists and appears in runtime product projection.'],
  ['A.exam-deadline',20,88,'Target date existed only in legacy track.','No canonical exam context.','Validated YYYY-MM-DD deadline with persistence/projection.','Exam allocation later','Invalid dates are rejected/cleared; valid deadline persists.'],
  ['A.exam-rubric',0,85,'Rubric/scoring context did not exist.','Exam optimization had no product-context input.','Rubric and target-score fields are canonical exam context.','Exam policy later','Rubric is learner-editable and remains separate from learner capability truth.'],
  ['A.product-plan',0,72,'Plan identity was undefined.','Billing/provider choices were intentionally unsettled.','Provider-neutral plan IDs and entitlement source are modeled.','Commercial backend later','No Stripe/provider assumption is baked into domain.'],
  ['A.trial-access',0,68,'Trial state was absent.','Trial was discussed but never modeled.','Provider-neutral trial boundary with honest UNCONFIGURED default.','Commercial decision later','Trial is representable without inventing duration or eligibility.'],
  ['A.subscription-boundary',0,65,'Subscription state had no place in architecture.','Auth and billing were conflated conceptually.','Opaque provider-neutral subscription boundary.','Commercial backend later','Unconfigured billing is explicit; no fake subscription.'],
  ['A.context-provenance',5,92,'Product facts had no source history.','Flat AsyncStorage object.','Per-domain provenance marks learner/auth/system/migration/entitlement-service updates.','Persistence','Learner changes cannot masquerade as entitlement-service changes.'],
  ['A.context-update',10,92,'Any caller could mutate any product field.','No update authority.','Learner mutations and system entitlement mutations are separate APIs.','Provider/context','Identity/access authority boundaries are enforced by API shape.'],
  ['A.active-experience',15,88,'General/Exam selection lacked canonical ownership.','Old product-selector logic was removed without a replacement.','Active experience is a product-context field checked against access truth.','Today/lesson','Selection is persisted and can be projected to runtime.'],
  ['A.onboarding-context',35,90,'Onboarding completion was one boolean with hard-coded answers.','Onboarding wrote compatibility fields directly.','Versioned onboarding state collects purpose/use/time and optional exam context.','Experience','Completion validator requires meaningful context without placement testing.'],
  ['A.runtime-projection',0,88,'Teacher/curriculum contracts could not consume real product context.','Rich context had no adapter.','Canonical profile projects to ProductContextV1 for outer/inner runtime consumers.','Curriculum/Teacher later','Projection includes learner, goal, time, mode and exam context.'],
  ['A.persistence',35,92,'One global V1 storage key mixed all users and duplicate fields.','Legacy AppData model.','Per-learner V2 storage with V1 migration and normalization.','Persistence subsystem','Reload is stable and legacy demo data migrates once.'],
  ['A.account-access-rules',25,82,'Authentication gate ignored product access semantics.','Only auth/onboarding were modeled.','Product experience access returns FULL/PREVIEW/BLOCKED without fabricating payment state.','Commercial backend later','Unknown access stays honest preview rather than paid/active.'],
] as const;

const independentAuditScoresV1:Readonly<Record<string,number>>=Object.freeze({"A.identity":75,"A.goals":75,"A.learning-purpose":75,"A.use-context":75,"A.current-priority":75,"A.study-time":90,"A.session-duration":75,"A.general-entitlement":50,"A.exam-entitlement":50,"A.exam-scope":75,"A.exam-deadline":75,"A.exam-rubric":50,"A.product-plan":25,"A.trial-access":25,"A.subscription-boundary":25,"A.context-provenance":75,"A.context-update":90,"A.active-experience":75,"A.onboarding-context":75,"A.runtime-projection":75,"A.persistence":75,"A.account-access-rules":50});

export const productWaveACapabilityStatusV1:readonly ProductWaveACapabilityStatusV1[]=Object.freeze(
  rows.map(([capabilityId,beforePercent,_afterPercent,problem,rootCause,upgrade,dependency,acceptance])=>{
    const afterPercent=independentAuditScoresV1[String(capabilityId)]??Number(_afterPercent);
    return{capabilityId:String(capabilityId),beforePercent:Number(beforePercent),afterPercent,problem:String(problem),rootCause:String(rootCause),upgrade:String(upgrade),dependency:String(dependency),acceptance:String(acceptance),auditAdjusted:afterPercent!==Number(_afterPercent)};
  })
);
