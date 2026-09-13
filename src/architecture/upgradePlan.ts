export type UpgradeWaveStateV1='SKELETON_ONLY'|'READY_FOR_AUDIT'|'IN_PROGRESS'|'COMPLETE_FIRST_PASS';
export interface MajorSubsystemUpgradeWaveV1 {order:number;subsystem:string;state:UpgradeWaveStateV1;rule:string}
const rule='Before implementation, audit every fine-grained capability in this subsystem; advance every capability that can legally move in the same wave; review cross-subsystem dependencies without expanding into an uncontrolled whole-repo rewrite.';
export const recommendedMajorSubsystemUpgradeWavesV1:readonly MajorSubsystemUpgradeWaveV1[]=Object.freeze(
  'ABCDEFGHIJKLMNOPQRSTUVWXY'.split('').map<MajorSubsystemUpgradeWaveV1>((subsystem,index)=>({order:index+1,subsystem,state:['A','B','C','D','E','F'].includes(subsystem)?'COMPLETE_FIRST_PASS':['G','H','I','K','L','M','N','O','P','Q','R','S','T','V'].includes(subsystem)?'READY_FOR_AUDIT':'SKELETON_ONLY',rule}))
);
