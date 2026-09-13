import type{GsatRecentResultV1,GsatSectionV1,ProductProfileV2}from'../../product';

export const GSAT_PRACTICE_FAMILIES_V1:readonly {id:GsatSectionV1;label:string;practiceFamily:string}[]=Object.freeze([
 {id:'VOCABULARY',label:'詞彙題',practiceFamily:'vocabulary_usage'},{id:'CLOZE',label:'綜合測驗',practiceFamily:'exam_comprehensive'},{id:'WORD_BANK',label:'文意選填',practiceFamily:'exam_contextual_fill'},{id:'DISCOURSE_STRUCTURE',label:'篇章結構',practiceFamily:'exam_discourse'},{id:'READING_COMPREHENSION',label:'閱讀測驗',practiceFamily:'exam_reading'},{id:'MIXED_FORMAT',label:'混合題',practiceFamily:'exam_mixed'},{id:'ZH_EN_TRANSLATION',label:'中譯英',practiceFamily:'translation'},{id:'ENGLISH_COMPOSITION',label:'英文作文',practiceFamily:'writing_output'},
]);
export function gsatMockPlanningSignalV1(results:readonly GsatRecentResultV1[]){return[...results].filter(x=>x.maximum>0&&x.lost>0).sort((a,b)=>(b.lost/b.maximum)-(a.lost/a.maximum)||b.lost-a.lost)[0]}
export function gsatColdStartDecisionV1(profile:ProductProfileV2,hasCanonicalEvidence:boolean){
 if(hasCanonicalEvidence)return{kind:'CANONICAL' as const};
 const signal=gsatMockPlanningSignalV1(profile.gsatBeta.recentResults);
 if(signal){const family=GSAT_PRACTICE_FAMILIES_V1.find(x=>x.id===signal.section)!;return{kind:'MOCK_DIAGNOSTIC' as const,section:signal.section,label:family.label,practiceFamily:family.practiceFamily,evidenceEligible:false as const}}
 return{kind:'CALIBRATION' as const,evidenceEligible:false as const};
}
export const GSAT_QUICK_CALIBRATION_PLAN_V1=Object.freeze(['VOCABULARY','VOCABULARY','CLOZE','WORD_BANK','DISCOURSE_STRUCTURE','READING_COMPREHENSION','READING_COMPREHENSION','ZH_EN_TRANSLATION'] as const);
