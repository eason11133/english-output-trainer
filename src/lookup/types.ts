import type{ProductionConditionsV1}from'../domain/task/TaskContract';

export type LookupUnitKindV1='PHRASE'|'CHUNK'|'WORD';
export type LookupAssessmentModeV1='NONE'|'LEARNING_CHECK'|'FORMAL_ASSESSMENT';

export interface LookupCandidateV1{
  id:string;
  label:string;
  kind:LookupUnitKindV1;
  start:number;
  end:number;
  meaningZhTw:string;
  note?:string;
  sourceRef?:string;
  wouldRevealTargetAnswer:boolean;
}

export interface LookupRequestV1{
  text:string;
  selectionStart:number;
  selectionEnd:number;
  contextText:string;
  assessmentMode:LookupAssessmentModeV1;
  activeTargetRefs:readonly string[];
}

export interface LookupDecisionV1{
  allowed:boolean;
  lockedReason?:'FORMAL_ASSESSMENT'|'TARGET_ANSWER_LEAK';
  candidate?:LookupCandidateV1;
  evidenceEligible:false;
  supportEffect:'NONE'|'LANGUAGE_ASSISTANCE';
}

export interface LookupHistoryEventV1{
  id:string;
  learnerId:string;
  sessionId:string;
  candidateId:string;
  label:string;
  kind:LookupUnitKindV1;
  occurredAt:string;
  assessmentMode:LookupAssessmentModeV1;
  evidenceEligible:false;
  productionConditionEffect:'LANGUAGE_ASSISTANCE';
}

export interface LookupDataSourceV1{
  candidates(request:Pick<LookupRequestV1,'text'|'selectionStart'|'selectionEnd'|'contextText'>):Promise<readonly LookupCandidateV1[]>;
}

export interface ContextualLookupPortV2{
  lookup(request:LookupRequestV1):Promise<LookupDecisionV1>;
}

export type LookupContaminatedConditionsV1=ProductionConditionsV1;
