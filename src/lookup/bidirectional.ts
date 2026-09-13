import type { ContextualLookupResultV1 } from './contextualResolution';
import type { LexicalLookupDirectionV1 } from '../learner-truth/lexicalEncounter';

export interface ReverseLookupRecordV1{zh:string;english:string;note?:string;kind:'PHRASE'|'CHUNK'|'WORD';targetRefs?:readonly string[]}
export const coreReverseLookupLexiconV1:readonly ReverseLookupRecordV1[]=Object.freeze([
  {zh:'這項支出',english:'this expense',kind:'CHUNK'},
  {zh:'總成本',english:'total cost',kind:'CHUNK'},
  {zh:'三分之一',english:'one third',kind:'CHUNK'},
  {zh:'占',english:'account for',note:'用來表示比例；後面接所占的整體。',kind:'PHRASE',targetRefs:['account for','account-for']},
  {zh:'公車通勤',english:'bus commuting',kind:'CHUNK'},
  {zh:'四分之一',english:'one quarter',kind:'CHUNK'},
]);
const norm=(value:string)=>value.normalize('NFKC').replace(/\s+/g,'').trim();
export const lookupDirectionForTextV1=(text:string):LexicalLookupDirectionV1=>/[\u3400-\u9fff]/.test(text)?'ZH_TO_EN':'EN_TO_ZH';
export function reverseLookupSegmentsV1(text:string,records:readonly ReverseLookupRecordV1[]=coreReverseLookupLexiconV1){const found:ReverseLookupRecordV1[]=[];for(const record of [...records].sort((a,b)=>b.zh.length-a.zh.length))if(norm(text).includes(norm(record.zh)))found.push(record);return Object.freeze(found)}
export function resolveReverseContextV1(input:{selected:string;context:string;activeTargetRefs:readonly string[];submitted:boolean},records:readonly ReverseLookupRecordV1[]=coreReverseLookupLexiconV1):ContextualLookupResultV1{const selected=norm(input.selected),record=records.filter(item=>selected.includes(norm(item.zh))||norm(item.zh).includes(selected)).sort((a,b)=>b.zh.length-a.zh.length)[0],base={tappedToken:input.selected,confidence:'LOW' as const,provenanceRefs:Object.freeze(['EOT_REVERSE_LOOKUP_V1']),supportEffect:'NONE' as const};if(!record)return{...base,status:'ABSTAIN'};const protectedTarget=!input.submitted&&record.targetRefs?.some(ref=>input.activeTargetRefs.some(target=>norm(target).includes(norm(ref))||norm(ref).includes(norm(target))));if(protectedTarget)return{...base,status:'LOCKED',lockReason:'TARGET_ANSWER_LEAK'};const start=input.context.indexOf(record.zh);return{status:'RESOLVED',tappedToken:input.selected,lemma:record.english,senseId:`reverse:${record.english.replace(/\s+/g,'-')}`,partOfSpeech:record.kind.toLowerCase(),meaningZhTw:record.english,localUnit:{text:record.zh,meaningZhTw:record.english,kind:record.kind==='WORD'?'CHUNK':record.kind},resolvedSpan:start>=0?{text:record.zh,start,end:start+record.zh.length}:undefined,usageNote:record.note,confidence:'HIGH',provenanceRefs:Object.freeze(['EOT_REVERSE_LOOKUP_V1']),supportEffect:'LOOKUP_ASSISTED'} }
