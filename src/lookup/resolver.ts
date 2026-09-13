import type{LookupCandidateV1,LookupRequestV1}from'./types';

const overlap=(candidate:LookupCandidateV1,request:LookupRequestV1)=>{
  const start=Math.min(request.selectionStart,request.selectionEnd),end=Math.max(request.selectionStart,request.selectionEnd);
  if(start===end)return candidate.start<=start&&candidate.end>=end;
  return candidate.start<end&&candidate.end>start;
};
const rank=(kind:LookupCandidateV1['kind'])=>kind==='PHRASE'?0:kind==='CHUNK'?1:2;

export function selectPhraseFirstLookupV1(candidates:readonly LookupCandidateV1[],request:LookupRequestV1):LookupCandidateV1|undefined{
  return candidates.filter(c=>overlap(c,request)).sort((a,b)=>rank(a.kind)-rank(b.kind)||(b.end-b.start)-(a.end-a.start)||a.start-b.start)[0];
}
