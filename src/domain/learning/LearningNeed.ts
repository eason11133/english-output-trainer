import { EnglishFacet,Relevance } from '../english/EnglishDomain';
export type Recurrence='UNKNOWN'|'ONCE'|'REPEATED'|'PERSISTENT';
export interface LearningNeed{id:string;targetRef:string;facet?:EnglishFacet|null;sourceEvidenceIds:string[];outcomeImpact:Relevance;evidenceStrength:Relevance;recurrence:Recurrence;goalRelevance:Relevance;readiness:Relevance;teachability:Relevance;transferValue:Relevance;informationValue:Relevance;timeCost:Relevance;whyNow:string;allowedTaskFamilies:string[];deferIf?:string[];source:'AUTHENTIC_BOTTLENECK'|'REPEATED_FRAGILITY'|'ASSISTED_ONLY'|'FAILED_TRANSFER'|'RETENTION_DUE'|'ENCOUNTER'|'GOAL'|'COMPOSITION'|'DIAGNOSTIC'}
export interface LearningNeedSelection{selected:LearningNeed|null;deferred:LearningNeed[];rationale:string[]}
