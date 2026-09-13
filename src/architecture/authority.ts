export interface AuthorityLayerV1 {id:string;subsystems:readonly string[];responsibility:string}
export const eotAuthorityLayersV1:readonly AuthorityLayerV1[]=Object.freeze([
  {id:'FOUNDATION_TRUTH',subsystems:['A','B','C'],responsibility:'Product context, English-domain truth, and canonical learner truth.'},
  {id:'CURRICULUM_POLICY',subsystems:['R','S','L','D'],responsibility:'General/Exam objectives, longitudinal needs, and what/why/when allocation.'},
  {id:'TUTOR_POLICY',subsystems:['E'],responsibility:'How to teach now at a pedagogical decision point.'},
  {id:'PEDAGOGICAL_MECHANISM',subsystems:['F','G','H','I','J','K'],responsibility:'Registered mechanisms, content, specializations, and measurement.'},
  {id:'SESSION_AND_INPUT',subsystems:['M','Q','P'],responsibility:'Session lifecycle, authentic input, and lookup constraints.'},
  {id:'EXPERIENCE',subsystems:['N'],responsibility:'Learner-facing experience contracts and information hierarchy.'},
  {id:'RENDERING',subsystems:['O'],responsibility:'UI rendering and interaction primitives; no pedagogy authority.'},
  {id:'PLATFORM',subsystems:['T','U','V'],responsibility:'Model, persistence/backend, and production reliability.'},
  {id:'OBSERVABILITY_AND_EVAL',subsystems:['W','X','Y'],responsibility:'Analytics, evaluation, and real-market validation readiness.'},
]);
export const eotForbiddenAuthorityRulesV1=Object.freeze([
  'UI_OR_REACT_OWNS_TUTOR_POLICY',
  'TODAY_OWNS_PRIVATE_LEARNER_TRUTH',
  'MY_ENGLISH_OWNS_PRIVATE_LEARNER_TRUTH',
  'GENERAL_OR_EXAM_FORKS_LEARNER_IDENTITY_OR_EVIDENCE',
  'MODEL_OUTPUT_WRITES_MASTERY_WITHOUT_CANONICAL_VALIDATION',
  'DEV_OR_REVIEW_FIXTURE_IS_IMPORTED_BY_PRODUCTION_ROUTE',
  'STAGE_OR_PROTOTYPE_ROUTE_BECOMES_PRODUCT_INFORMATION_ARCHITECTURE',
] as const);
