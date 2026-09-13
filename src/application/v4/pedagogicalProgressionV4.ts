import { ObjectiveState } from '../../domain/v4/CoreArchitectureV4';
import { PedagogicalRoleV4 } from '../../domain/v4/LearningBlockV4';

export type IndependentVerificationStatusV4='NOT_OBSERVED'|'SUCCESS'|'FAILED'|'ASSISTED_INVALIDATED';
export type TransferQualificationStatusV4='NOT_ESTABLISHED'|'ESTABLISHED';
export interface PedagogicalProgressionInputV4{
  objectiveState:ObjectiveState;
  teachingCompleted:boolean;
  supportedPracticeCompleted:boolean;
  learnerReadyForVerification:boolean;
  independentVerificationStatus:IndependentVerificationStatusV4;
  strongPriorIndependentEvidence:boolean;
  transferQualificationStatus:TransferQualificationStatusV4;
}
export interface PedagogicalProgressionV4 extends PedagogicalProgressionInputV4{
  eligiblePedagogicalIntents:PedagogicalRoleV4[];
  transferEligibility:'LOCKED'|'ELIGIBLE'|'ALREADY_ESTABLISHED';
  derivedBy:'EOT_PROGRESSION_POLICY_V4';
}
export function derivePedagogicalProgressionV4(input:PedagogicalProgressionInputV4):PedagogicalProgressionV4{
  const independentlyVerified=input.independentVerificationStatus==='SUCCESS'||input.strongPriorIndependentEvidence;
  let eligible:PedagogicalRoleV4[];
  if(input.transferQualificationStatus==='ESTABLISHED')eligible=['SYSTEM','ASSESS'];
  else if(independentlyVerified)eligible=['ASSESS','TRANSFER','SYSTEM'];
  else if(input.supportedPracticeCompleted)eligible=input.learnerReadyForVerification?['PRACTICE','ASSESS','SYSTEM']:['PRACTICE','SYSTEM'];
  else if(input.teachingCompleted)eligible=['PRACTICE','ASSESS','SYSTEM'];
  else eligible=['TEACH','PRACTICE','ASSESS','SYSTEM'];
  return{...input,eligiblePedagogicalIntents:eligible,transferEligibility:input.transferQualificationStatus==='ESTABLISHED'?'ALREADY_ESTABLISHED':independentlyVerified?'ELIGIBLE':'LOCKED',derivedBy:'EOT_PROGRESSION_POLICY_V4'};
}
export function validatePedagogicalIntentEligibilityV4(intent:PedagogicalRoleV4,progression:PedagogicalProgressionV4):string[]{return progression.eligiblePedagogicalIntents.includes(intent)?[]:[`pedagogical intent ${intent} is not eligible from canonical progression state`]}
