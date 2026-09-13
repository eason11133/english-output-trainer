import { defaultTeachingOpportunityConditionsV1, type TeachingRequestV1 } from '../teaching';

export type FounderTeacherScenarioIdV1='SAME_ERROR_LEVEL'|'DIFFERENT_CAUSE'|'RECOMPOSE'|'ASSISTED_FADE'|'POLYSEMY'|'COLLOCATION'|'WRITING_RETURN'|'TRANSLATION_RETURN'|'READING_CAUSE'|'CROSS_SESSION'|'DETERMINISTIC'|'MODEL_RECOMPOSE'|'DELAYED_RETENTION';
export interface FounderTeacherScenarioV1{id:FounderTeacherScenarioIdV1;label:string;mode:'WRITING'|'TRANSLATION'|'READING'|'LANGUAGE';purpose:string;request:TeachingRequestV1;expectedRoute:'MODEL_REQUIRED'|'DETERMINISTIC_CONTINUATION'|'AVOIDED_MODEL_CALL'}

const base=(overrides:Partial<TeachingRequestV1>={}):TeachingRequestV1=>({
  targetRef:'allow-object-infinitive',facet:'CONSTRUCTION',targetArea:'GRAMMAR',targetKind:'GRAMMAR_CONSTRUCTION',learnerState:'OBSERVED_FRAGILE',supportDependence:'UNKNOWN',competingHypotheses:[],
  current:{outcome:'FAILURE',support:'NONE',eventKind:'LEARNER_RESPONSE'},
  conditions:defaultTeachingOpportunityConditionsV1({support:'NONE',elicitation:'OPEN_CHOICE',context:'SOURCE',taskLoad:'MEDIUM'}),recentTreatment:[],...overrides,
});
const item=(id:FounderTeacherScenarioIdV1,label:string,mode:FounderTeacherScenarioV1['mode'],purpose:string,request:TeachingRequestV1,expectedRoute:FounderTeacherScenarioV1['expectedRoute']='MODEL_REQUIRED'):FounderTeacherScenarioV1=>Object.freeze({id,label,mode,purpose,request,expectedRoute});

export const founderTeacherScenariosV1:readonly FounderTeacherScenarioV1[]=Object.freeze([
  item('SAME_ERROR_LEVEL','Same error, different level','WRITING','Compare support without changing the D target.',base({learnerState:'OBSERVED_FRAGILE',supportDependence:'HIGH'})),
  item('DIFFERENT_CAUSE','Same surface, different cause','WRITING','Change HOW from supported cause evidence.',base({competingHypotheses:[{id:'meaning-form',label:'meaning-form mapping',status:'SUPPORTED',sourceEvidenceIds:['obs:1']}]})),
  item('RECOMPOSE','Mechanism A fails','WRITING','Exclude an ineffective mechanism and change representation.',base({recentTreatment:[{mechanismId:'grammar-role-map',support:'GUIDED',outcome:'FAILURE',responseSignal:'CONFUSED'}]})),
  item('ASSISTED_FADE','Assisted success fades','LANGUAGE','Fade support without claiming independence.',base({current:{outcome:'SUCCESS',support:'GUIDED',eventKind:'LEARNER_RESPONSE'}}),'DETERMINISTIC_CONTINUATION'),
  item('POLYSEMY','Known sense A, needed sense B','LANGUAGE','Teach only the exact unresolved sense.',base({targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',targetArea:'LEXICAL',targetKind:'SENSE',learnerState:'UNKNOWN'})),
  item('COLLOCATION','Collocation relation','LANGUAGE','Teach the lexical relation rather than reteaching both known words.',base({targetRef:'translation.naturalness-precision',facet:'SENSE_DISCRIMINATION',targetArea:'TRANSLATION',targetKind:'TRANSLATION_CAPABILITY'})),
  item('WRITING_RETURN','Writing feedback budget','WRITING','Teach one high-value target then return to the original writing.',base({targetRef:'writing.sentence-realization',facet:'FREE_PRODUCTION',targetArea:'WRITING',targetKind:'WRITING_CAPABILITY'})),
  item('TRANSLATION_RETURN','Translation return','TRANSLATION','Diagnose and return answer-safely to the original translation.',base({targetRef:'translation.source-meaning',facet:'FORM_TO_MEANING',targetArea:'TRANSLATION',targetKind:'TRANSLATION_CAPABILITY'})),
  item('READING_CAUSE','Reading ability vs procedure','READING','Keep language ability separate from exam procedure.',base({targetRef:'reading.inference',facet:'FORM_TO_MEANING',targetArea:'READING',targetKind:'READING_CAPABILITY'})),
  item('CROSS_SESSION','Cross-session response','WRITING','Use matching prior treatment response in future HOW.',base({recentTreatment:[{mechanismId:'grammar-role-map',support:'GUIDED',outcome:'FAILURE',responseSignal:'NO_PROGRESS',occurredAt:'2026-08-30T00:00:00Z'}]})),
  item('DETERMINISTIC','Deterministic continuation','LANGUAGE','Avoid a model call for a known transition.',base({current:{outcome:'SUCCESS',support:'GUIDED',eventKind:'LEARNER_RESPONSE'}}),'AVOIDED_MODEL_CALL'),
  item('MODEL_RECOMPOSE','Meaningful recomposition','WRITING','Permit model reasoning at a material representation change.',base({recentTreatment:[{mechanismId:'grammar-role-map',support:'EXPLICIT',outcome:'FAILURE',responseSignal:'CONFUSED'}]})),
  item('DELAYED_RETENTION','Delayed retention','LANGUAGE','Exercise existing delayed-retention semantics without changing C/K authority.',base({targetRef:'sense.allow.permission',facet:'SENSE_DISCRIMINATION',targetArea:'LEXICAL',targetKind:'SENSE',learnerState:'RETENTION_PENDING',current:{outcome:'NOT_EVALUATED',support:'NONE',eventKind:'RETENTION_DUE'}}),'DETERMINISTIC_CONTINUATION'),
]);

export function founderTeacherScenarioV1(id:FounderTeacherScenarioIdV1){const scenario=founderTeacherScenariosV1.find(value=>value.id===id);if(!scenario)throw new Error(`unknown_founder_teacher_scenario:${id}`);return scenario}
