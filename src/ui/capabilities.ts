export type UICapabilityStatusV1='FIRST_PASS'|'CONTRACT_ONLY'|'BLOCKED_EXTERNAL';
export interface UICapabilityStateV1{id:string;status:UICapabilityStatusV1;note:string}
export const uiCapabilityStatesV1:readonly UICapabilityStateV1[]=Object.freeze([
 {id:'O.tokens',status:'FIRST_PASS',note:'Production learner surfaces share canonical palette/layout/radius/spacing tokens.'},
 {id:'O.typography',status:'FIRST_PASS',note:'Learner hierarchy uses bounded title/body/label scales rather than debug-density typography.'},
 {id:'O.spacing-layout',status:'FIRST_PASS',note:'Mobile-first shell and lesson widths use bounded spacing and max-width contracts.'},
 {id:'O.material-language',status:'FIRST_PASS',note:'Warm paper/wood visual language is presentation-only and does not encode evidence authority.'},
 {id:'O.manuscript',status:'FIRST_PASS',note:'Learner output remains the dominant editable manuscript surface.'},
 {id:'O.language-object',status:'FIRST_PASS',note:'Teaching blocks can render manipulable language objects independently of chat UI.'},
 {id:'O.inputs',status:'FIRST_PASS',note:'Writing/Translation inputs preserve source/output separation and multiline editing.'},
 {id:'O.actions',status:'FIRST_PASS',note:'Primary and secondary actions use explicit hierarchy and >=44pt touch targets.'},
 {id:'O.intervention-renderers',status:'FIRST_PASS',note:'Role map/contrast, lexical retrieval, composition and short-feedback renderers exist.'},
 {id:'O.feedback-states',status:'FIRST_PASS',note:'Neutral/positive/error states are visually distinct without exposing internal labels.'},
 {id:'O.sheets-overlays',status:'CONTRACT_ONLY',note:'No general overlay system is required for the current Beta; deeper sheet behavior is deferred.'},
 {id:'O.motion',status:'CONTRACT_ONLY',note:'No motion language is claimed before rendered/device acceptance.'},
 {id:'O.accessibility',status:'CONTRACT_ONLY',note:'Roles/labels/touch targets exist, but screen-reader and dynamic-type device acceptance is pending.'},
 {id:'O.touch-targets',status:'FIRST_PASS',note:'Canonical minimum touch target is 44 and primary/secondary learning actions meet it.'},
 {id:'O.responsive',status:'FIRST_PASS',note:'Learner surfaces are mobile-first with bounded max widths for larger screens.'},
 {id:'O.dev-separation',status:'FIRST_PASS',note:'Review/dev routes remain under __dev__; production surfaces do not display Stage/debug/authority internals.'},
]);
export const uiWaveSummaryV1=()=>({firstPass:uiCapabilityStatesV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:uiCapabilityStatesV1.filter(x=>x.status==='CONTRACT_ONLY').length,blockedExternal:uiCapabilityStatesV1.filter(x=>x.status==='BLOCKED_EXTERNAL').length});
