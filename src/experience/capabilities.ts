export type ExperienceCapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface ExperienceCapabilityStateV1{id:string;status:ExperienceCapabilityStatusV1;note:string}
export const experienceCapabilityStatesV1:readonly ExperienceCapabilityStateV1[]=Object.freeze([
 {id:'N.ia-navigation',status:'FIRST_PASS',note:'Founder-directed first-level spine is Today / Practice / My English; Progress / History is secondary under My English.'},
 {id:'N.onboarding-ux',status:'FIRST_PASS',note:'Goal/use-context/time and Exam context onboarding are learner-facing and do not create capability evidence.'},
 {id:'N.today-ux',status:'FIRST_PASS',note:'Today exposes one dominant start/resume action and bounded why-now context.'},
 {id:'N.lesson-ux',status:'FIRST_PASS',note:'Runtime phase is translated into action-first learner copy without exposing Teacher internals.'},
 {id:'N.authentic-intake-ux',status:'FIRST_PASS',note:'Writing prompt/rubric/work and Translation source/output remain distinct; camera/gallery/PDF stay secondary intake paths.'},
 {id:'N.writing-ux',status:'FIRST_PASS',note:'Original work, focused repair, validated fresh task and return-original are visually separated.'},
 {id:'N.translation-ux',status:'FIRST_PASS',note:'Chinese source and learner English are presented as separate objects with fresh retranslation support.'},
 {id:'N.assessment-ux',status:'CONTRACT_ONLY',note:'Fresh/transfer experience copy exists; formal Exam isolation/lookup lock still requires K/S/P integration and device acceptance.'},
 {id:'N.result-ux',status:'FIRST_PASS',note:'Result distinguishes independent/assisted/source-return outcomes instead of activity counts.'},
 {id:'N.my-english-ux',status:'FIRST_PASS',note:'My English is evidence-backed and refuses to guess when data is absent.'},
 {id:'N.journey-ux',status:'FIRST_PASS',note:'Legacy capability id now renders meaningful Progress / History under My English rather than a first-level Journey tab.'},
 {id:'N.explore-ux',status:'CONTRACT_ONLY',note:'Explore remains secondary product scope and is not yet a production route.'},
 {id:'N.help-stuck-ux',status:'FIRST_PASS',note:'Learner can explicitly ask for help without that request becoming failure evidence.'},
 {id:'N.source-correction-ux',status:'FIRST_PASS',note:'Learner can correct OCR/intent before diagnosis; correction is visibly non-evidence.'},
 {id:'N.loading-error-ux',status:'FIRST_PASS',note:'Primary learner screens have bounded loading/error/empty states instead of silent failure.'},
 {id:'N.resume-ux',status:'FIRST_PASS',note:'Active runtime hydration resumes the saved pedagogical state; closed sessions do not reopen.'},
 {id:'N.keyboard-back',status:'CONTRACT_ONLY',note:'Keyboard-aware layout exists; physical back/IME interruption acceptance remains pending.'},
 {id:'N.general-exam-experience',status:'CONTRACT_ONLY',note:'Product mode changes bounded context/optimizer copy; full formal Exam experience is downstream.'},
 {id:'N.information-hierarchy',status:'FIRST_PASS',note:'One dominant learner action per state; prompt/source, learner output, intervention and status have explicit hierarchy.'},
 {id:'N.internal-hiding',status:'FIRST_PASS',note:'Production copy hides evidence categories, target IDs, mechanisms, Stage/debug labels and model reasoning.'},
 {id:'N.experience-contract',status:'FIRST_PASS',note:'Teacher decisions execute through ExperienceContract/OutputWorkspace VM before rendering.'},
]);
export const experienceWaveSummaryV1=()=>({firstPass:experienceCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:experienceCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,blockedExternal:experienceCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length});
