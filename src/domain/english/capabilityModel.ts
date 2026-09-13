import { CapabilityFacet } from './EnglishDomain';
import { EnglishCapabilityConditionV2, EnglishDomainPortV2 } from './EnglishDomainGraph';

export interface EnglishCapabilityClaimV2{
  targetRef:string;
  facet:CapabilityFacet;
}

export interface QualifiedEnglishCapabilityClaimV2 extends EnglishCapabilityClaimV2{
  canonicalTargetRef:string;
}

export interface EnglishCapabilityObservationContextV2{
  claim:QualifiedEnglishCapabilityClaimV2;
  conditions:EnglishCapabilityConditionV2;
}

export function qualifyEnglishCapabilityClaimV2(domain:EnglishDomainPortV2,claim:EnglishCapabilityClaimV2):{accepted:true;claim:QualifiedEnglishCapabilityClaimV2}|{accepted:false;reasons:readonly string[]}{
  const canonicalTargetRef=domain.resolveId(claim.targetRef);
  const reasons:string[]=[];
  if(!canonicalTargetRef)reasons.push(`unknown English target: ${claim.targetRef}`);
  else if(!domain.supportsFacet(canonicalTargetRef,claim.facet))reasons.push(`target ${canonicalTargetRef} does not afford facet ${claim.facet}`);
  return reasons.length?{accepted:false,reasons}:{accepted:true,claim:{...claim,canonicalTargetRef:canonicalTargetRef!}};
}

export function capabilityClaimKeyV2(claim:QualifiedEnglishCapabilityClaimV2):string{return `${claim.canonicalTargetRef}::${claim.facet}`}

/** These conditions constrain what evidence means; they are not English-domain nodes and never imply learner mastery by themselves. */
export function sameCapabilityDifferentConditionV2(a:EnglishCapabilityObservationContextV2,b:EnglishCapabilityObservationContextV2):boolean{
  return capabilityClaimKeyV2(a.claim)===capabilityClaimKeyV2(b.claim)&&JSON.stringify(a.conditions)!==JSON.stringify(b.conditions);
}
