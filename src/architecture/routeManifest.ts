export type RouteVisibilityV1='PRODUCTION'|'SECONDARY'|'DEV_ONLY';
export interface LearnerRouteDefinitionV1 {
  id:string;
  path:string;
  owner_subsystem:'N'|'X';
  visibility:RouteVisibilityV1;
  first_level:boolean;
  purpose:string;
}
export const eotLearnerRouteManifestV1:readonly LearnerRouteDefinitionV1[]=Object.freeze([
  {id:'ONBOARDING_GOALS',path:'/onboarding/goals',owner_subsystem:'N',visibility:'PRODUCTION',first_level:false,purpose:'Collect the minimum context needed to begin.'},
  {id:'ONBOARDING_TIME',path:'/onboarding/time',owner_subsystem:'N',visibility:'PRODUCTION',first_level:false,purpose:'Set available learning time without performing placement.'},
  {id:'ONBOARDING_EXAM',path:'/onboarding/exam',owner_subsystem:'N',visibility:'PRODUCTION',first_level:false,purpose:'Collect minimum Exam context only when the learner selected an exam purpose.'},
  {id:'TODAY',path:'/(tabs)',owner_subsystem:'N',visibility:'PRODUCTION',first_level:true,purpose:'Current next learning or authentic-output entry.'},
  {id:'PRACTICE',path:'/(tabs)/practice',owner_subsystem:'N',visibility:'PRODUCTION',first_level:true,purpose:'Learner-chosen General or Exam practice and canonical external-material import entry.'},
  {id:'MY_ENGLISH',path:'/(tabs)/my-english',owner_subsystem:'N',visibility:'PRODUCTION',first_level:true,purpose:'Learner-friendly ability projection with deep links into Practice.'},
  {id:'PROGRESS_HISTORY',path:'/progress-history',owner_subsystem:'N',visibility:'SECONDARY',first_level:false,purpose:'Meaningful capability events across time, reached from My English.'},
  {id:'LESSON',path:'/daily-lesson',owner_subsystem:'N',visibility:'PRODUCTION',first_level:false,purpose:'Persistent adaptive Output Workspace and lesson runtime.'},
  {id:'READING_ATTEMPT',path:'/reading-attempt',owner_subsystem:'N',visibility:'SECONDARY',first_level:false,purpose:'Imported Reading practice or locked assessment attempt.'},
  {id:'RESULT',path:'/result',owner_subsystem:'N',visibility:'PRODUCTION',first_level:false,purpose:'Evidence-grounded story of what changed and what remains unproven.'},
  {id:'PROFILE',path:'/profile',owner_subsystem:'N',visibility:'SECONDARY',first_level:false,purpose:'Learner settings and product context.'},
  {id:'SETTINGS',path:'/settings',owner_subsystem:'N',visibility:'SECONDARY',first_level:false,purpose:'Secondary settings surface.'},
  {id:'DEV_OUTPUT_WORKSPACE',path:'/__dev__/output-workspace',owner_subsystem:'X',visibility:'DEV_ONLY',first_level:false,purpose:'Controlled adaptive runtime/evaluation harness.'},
  {id:'DEV_TEACHER_CORE',path:'/__dev__/teacher-core',owner_subsystem:'X',visibility:'DEV_ONLY',first_level:false,purpose:'Founder-only adaptive Teacher scenario and lineage harness.'},
]);
export const eotFirstLevelNavigationV1=Object.freeze(['TODAY','PRACTICE','MY_ENGLISH'] as const);
