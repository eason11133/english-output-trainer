import { coreEnglishDomainPortV2 } from '../../domain/english';

const normalized=(value:string)=>value.toLowerCase().replace(/[.,!?]/g,'').replace(/\s+/g,' ').trim();

const canonicalAllowTarget=coreEnglishDomainPortV2.resolveId('allow-object-infinitive');
if(!canonicalAllowTarget)throw new Error('canonical_allow_object_infinitive_target_missing');
export const ALLOW_OBJECT_INFINITIVE_TARGET_REF=canonicalAllowTarget;

export function evaluateAllowConstructionV4(value:string,context:'GUIDED'|'LIGHT'|'ASSESS'|'SOURCE'):boolean{
  const v=normalized(value);
  const hasFrame=/\ballow(?:s|ed)?\s+(?:the\s+)?[a-z]+(?:\s+[a-z]+){0,2}\s+to\s+[a-z]+/.test(v);
  if(!hasFrame)return false;
  if(context==='GUIDED')return /parents should allow (?:their )?children to choose (?:their )?hobbies/.test(v);
  if(context==='LIGHT')return /(?:the )?compan(?:y|ies) should allow (?:their )?employees to work (?:from|at) home/.test(v);
  if(context==='ASSESS')return /(?:the )?librar(?:y|ies) should allow (?:their )?visitors to use (?:the )?computers/.test(v);
  return /schools should allow (?:their )?(?:students|children|learners|pupils) to use phones(?: for learning)?/.test(v);
}

export function sourceIntentKeepsAllowTargetV4(value:string):boolean{
  const v=normalized(value);
  return /(allow|允許)/.test(v)&&/(phone|手機)/.test(v);
}

export const allowLookupEntries=[
  {id:'allow-frame',label:'allow … to …',meaning:'允許某人／某物做某事',note:'allow 後面先放「被允許的對象」，再接 to 和動作。'},
  {id:'allow-students',label:'allow students to use',meaning:'允許學生使用',note:'students 是執行 use 這個動作的人。'},
  {id:'use-phones',label:'use phones',meaning:'使用手機',note:'這是被允許進行的動作。'}
] as const;
