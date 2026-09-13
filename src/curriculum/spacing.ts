import type { CapabilityProjection } from '../domain/learner/LearnerModelV3';
import type { CurriculumNeedKindV1, CurriculumFrontierV1 } from './types';

export interface ReencounterClassificationV1{
  frontier:CurriculumFrontierV1;
  needKind:CurriculumNeedKindV1;
  dueNow:boolean;
  reason:'NEW_CAPABILITY'|'OBSERVED_FRAGILE'|'SUPPORT_DEPENDENT'|'TRANSFER_UNVERIFIED'|'RETENTION_UNVERIFIED'|'ALREADY_STABLE';
}

const hoursBetween=(earlier:string,later:string)=>{
  const delta=Date.parse(later)-Date.parse(earlier);
  return Number.isFinite(delta)?Math.max(delta/3600000,0):0;
};

export function classifyReencounterNeedV1(
  projection:CapabilityProjection|undefined,
  now:string,
  retentionMinimumDelayHours=24,
):ReencounterClassificationV1{
  if(!projection)return{frontier:'READY',needKind:'NEW_LEARNING',dueNow:true,reason:'NEW_CAPABILITY'};
  switch(projection.state){
    case 'UNKNOWN':
      return{frontier:'READY',needKind:'NEW_LEARNING',dueNow:true,reason:'NEW_CAPABILITY'};
    case 'OBSERVED_FRAGILE':
      return{frontier:'REINFORCEMENT',needKind:projection.historicalIndependentControl?'REACTIVATION':'REPAIR',dueNow:true,reason:'OBSERVED_FRAGILE'};
    case 'ASSISTED_CONTROL':
      return{frontier:'REINFORCEMENT',needKind:'INDEPENDENCE',dueNow:true,reason:'SUPPORT_DEPENDENT'};
    case 'INDEPENDENT_LOCAL_CONTROL':
    case 'TRANSFER_PENDING':
      return{frontier:'TRANSFER',needKind:'TRANSFER',dueNow:true,reason:'TRANSFER_UNVERIFIED'};
    case 'TRANSFER_SUPPORTED':
      return{frontier:'RETENTION',needKind:'RETENTION',dueNow:true,reason:'RETENTION_UNVERIFIED'};
    case 'RETENTION_PENDING':{
      const elapsed=projection.latestEvidenceAt?hoursBetween(projection.latestEvidenceAt,now):0;
      return{frontier:'RETENTION',needKind:'RETENTION',dueNow:Boolean(projection.latestEvidenceAt)&&elapsed>=retentionMinimumDelayHours,reason:'RETENTION_UNVERIFIED'};
    }
    case 'RETENTION_SUPPORTED':
      return{frontier:'MAINTENANCE',needKind:'MAINTENANCE',dueNow:false,reason:'ALREADY_STABLE'};
  }
}
