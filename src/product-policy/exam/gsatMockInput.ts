import type { GsatRecentResultV1, GsatSectionV1 } from '../../product';

export type GsatMockEntryKindV1='WRONG_COUNT'|'SCORE';
export interface GsatMockSectionInputV1{section:GsatSectionV1;maximum:number;maxInput:number;pointValue:number;kind:GsatMockEntryKindV1}

export function normalizeGsatMockInputV1(value:string,kind:GsatMockEntryKindV1){
  const cleaned=value.replace(kind==='SCORE'?/[^\d.]/g:/\D/g,'');
  if(kind==='WRONG_COUNT')return cleaned;
  const [whole,...decimals]=cleaned.split('.');
  return decimals.length?`${whole}.${decimals.join('').slice(0,1)}`:whole;
}

export function gsatRecentResultFromInputV1(input:{definition:GsatMockSectionInputV1;raw:string;reportedAt:string}):GsatRecentResultV1|undefined{
  const normalized=normalizeGsatMockInputV1(input.raw,input.definition.kind).trim();
  if(!normalized)return undefined;
  const parsed=Number(normalized);
  if(!Number.isFinite(parsed))return undefined;
  const value=Math.max(0,Math.min(input.definition.maxInput,parsed));
  return Object.freeze({
    section:input.definition.section,
    lost:input.definition.kind==='WRONG_COUNT'?value*input.definition.pointValue:input.definition.maximum-value,
    maximum:input.definition.maximum,
    reportedAt:input.reportedAt,
    evidenceEligible:false,
  });
}
