export type PracticeFamilyV1='VOCABULARY_USAGE'|'PHRASES_COLLOCATIONS'|'GRAMMAR'|'READING'|'TRANSLATION'|'WRITING'|'CLOZE'|'CONTEXTUAL_FILL'|'DISCOURSE'|'MIXED';
export type PracticeAvailabilityV1='WORKING'|'PARTIAL'|'UNAVAILABLE';
export type PracticeOriginV1='PRACTICE'|'MY_ENGLISH'|'IMPORTED_WORK';
export interface PracticeEntryV1{id:PracticeFamilyV1;label:string;product:'GENERAL'|'EXAM'|'BOTH';availability:PracticeAvailabilityV1;destination?:'/daily-lesson'|'/reading-attempt'|'/exam-practice';unit:'ITEMS'|'SENTENCES'|'WRITING_SCALE';amounts:readonly string[];learnerMessage:string;engineeringReason:string}
export const practiceEntriesV1:readonly PracticeEntryV1[]=Object.freeze([
  {id:'VOCABULARY_USAGE',label:'詞彙題',product:'BOTH',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['1 題'],learnerMessage:'用學測語境練字義、搭配與詞性判斷。',engineeringReason:'validated GSAT Exam vocabulary bank'},
  {id:'READING',label:'閱讀測驗',product:'BOTH',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['1 組'],learnerMessage:'用短篇文章確認證據、推論與選項判斷。',engineeringReason:'validated Exam beta bank'},
  {id:'TRANSLATION',label:'中譯英',product:'BOTH',availability:'WORKING',destination:'/exam-practice',unit:'SENTENCES',amounts:['1 句','2 句'],learnerMessage:'EOT 直接提供單句或完整兩句題。',engineeringReason:'validated Exam beta bank'},
  {id:'WRITING',label:'英文作文',product:'BOTH',availability:'WORKING',destination:'/exam-practice',unit:'WRITING_SCALE',amounts:['短練習','一段','完整作文'],learnerMessage:'從題意、內容組織到英文表達逐步完成。',engineeringReason:'validated Exam beta bank'},
  {id:'CLOZE',label:'綜合測驗',product:'EXAM',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['1 篇'],learnerMessage:'完整篇章多空格題可直接開始。',engineeringReason:'validated Exam beta bank'},
  {id:'CONTEXTUAL_FILL',label:'文意選填',product:'EXAM',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['完整 10 題'],learnerMessage:'10 空格與 10 個共用選項。',engineeringReason:'validated Exam beta bank'},
  {id:'DISCOURSE',label:'篇章結構',product:'EXAM',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['完整題組'],learnerMessage:'4 空格與 5 個句子選項，其中一個不使用。',engineeringReason:'validated Exam beta bank'},
  {id:'MIXED',label:'混合題',product:'EXAM',availability:'WORKING',destination:'/exam-practice',unit:'ITEMS',amounts:['1 組'],learnerMessage:'同一份素材包含至少兩種作答方式。',engineeringReason:'validated Exam beta bank'},
]);
export function visiblePracticeEntriesV1(_mode:'GENERAL'|'EXAM'){return practiceEntriesV1.filter(item=>!['PHRASES_COLLOCATIONS','GRAMMAR'].includes(item.id))}
export function practiceEntryV1(id:string|undefined){return practiceEntriesV1.find(item=>item.id===id)}
export function practiceRouteParamsV1(input:{entry:PracticeEntryV1;origin:PracticeOriginV1;area?:string;amount?:string}){return Object.freeze({origin:input.origin,practiceFamily:input.entry.id,practiceArea:input.area??input.entry.id,amount:input.amount??input.entry.amounts[0],systemTask:'AUTO',mode:input.entry.id==='TRANSLATION'?'TRANSLATION':input.entry.id==='WRITING'?'WRITING':undefined})}
