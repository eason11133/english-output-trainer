import type { CapabilityFacet } from '../../domain/english/EnglishDomain';
import { applyWritingFeedbackBudgetV1 } from './feedbackBudget';
import type { WritingDimensionV1, WritingInterpretationConfidenceV1, WritingIssueImpactV1, WritingIssueScopeV1, WritingOpportunityCandidateV1 } from './types';

export interface WritingIssueEvidenceV1 {
  evidenceId:string;
  dimension:WritingDimensionV1;
  sourceSpan:{start:number;end:number};
  rootIssueHypothesis:string;
  impact:WritingIssueImpactV1;
  confidence:WritingInterpretationConfidenceV1;
  scope:WritingIssueScopeV1;
  reasonCodes:readonly string[];
  possibleBottlenecks:readonly string[];
  targetRefs:readonly string[];
  facets:readonly CapabilityFacet[];
  rubricRelevance:readonly string[];
}

export interface WritingBottleneckClusterV1 {
  clusterId:string;
  dimension:WritingDimensionV1;
  evidenceSpans:readonly {start:number;end:number;evidenceId:string}[];
  rootIssueHypothesis:string;
  impact:WritingIssueImpactV1;
  confidence:WritingInterpretationConfidenceV1;
  scope:WritingIssueScopeV1;
  reasonCodes:readonly string[];
  targetRefs:readonly string[];
  facets:readonly CapabilityFacet[];
  possibleBottlenecks:readonly string[];
  rubricRelevance:readonly string[];
}

export interface WritingMultiBottleneckDiagnosisV1 {
  status:'NO_MATERIAL_CLUSTER'|'CLUSTERS_READY'|'ABSTAIN';
  clusters:readonly WritingBottleneckClusterV1[];
  selectedCandidates:readonly WritingOpportunityCandidateV1[];
  deferredClusterIds:readonly string[];
  dReplanRequests:readonly {clusterId:string;reason:'CRITICAL_OUT_OF_TARGET_ISSUE';requestedTargetRefs:readonly string[]}[];
  maxConcurrentTeachingTargets:1;
  capabilityClaimAllowed:false;
  reasonCodes:readonly string[];
}

const impactRank:Record<WritingIssueImpactV1,number>={TASK_BLOCKING:5,MEANING_BLOCKING:4,HIGH:3,MEDIUM:2,LOW:1};
const confidenceRank:Record<WritingInterpretationConfidenceV1,number>={HIGH:3,MEDIUM:2,LOW:1};
const uniq=<T>(values:readonly T[])=>Object.freeze([...new Set(values)]);
const key=(item:WritingIssueEvidenceV1)=>`${item.dimension}\u0000${item.rootIssueHypothesis.trim().toLowerCase()}`;

export function diagnoseWritingMultiBottlenecksV1(input:{artifactId:string;text:string;authorizedTargetRef:string;evidence:readonly WritingIssueEvidenceV1[];analysisComplete:boolean;maxVisibleCandidates?:number}):WritingMultiBottleneckDiagnosisV1 {
  if(!input.analysisComplete)return Object.freeze({status:'ABSTAIN',clusters:Object.freeze([]),selectedCandidates:Object.freeze([]),deferredClusterIds:Object.freeze([]),dReplanRequests:Object.freeze([]),maxConcurrentTeachingTargets:1,capabilityClaimAllowed:false,reasonCodes:Object.freeze(['WRITING_ANALYSIS_INCOMPLETE'])});
  const valid=input.evidence.filter(item=>item.sourceSpan.start>=0&&item.sourceSpan.end>item.sourceSpan.start&&item.sourceSpan.end<=input.text.length&&item.rootIssueHypothesis.trim()&&item.confidence!=='LOW');
  const grouped=new Map<string,WritingIssueEvidenceV1[]>();for(const item of valid)grouped.set(key(item),[...(grouped.get(key(item))??[]),item]);
  const clusters=[...grouped.values()].map((items,index):WritingBottleneckClusterV1=>{
    const strongest=[...items].sort((a,b)=>impactRank[b.impact]-impactRank[a.impact]||confidenceRank[b.confidence]-confidenceRank[a.confidence])[0];
    return Object.freeze({clusterId:`writing-cluster:${input.artifactId}:${index+1}`,dimension:strongest.dimension,evidenceSpans:Object.freeze(items.map(item=>Object.freeze({...item.sourceSpan,evidenceId:item.evidenceId}))),rootIssueHypothesis:strongest.rootIssueHypothesis,impact:strongest.impact,confidence:strongest.confidence,scope:strongest.scope,reasonCodes:uniq(items.flatMap(item=>item.reasonCodes)),targetRefs:uniq(items.flatMap(item=>item.targetRefs)),facets:uniq(items.flatMap(item=>item.facets)),possibleBottlenecks:uniq(items.flatMap(item=>item.possibleBottlenecks)),rubricRelevance:uniq(items.flatMap(item=>item.rubricRelevance))});
  });
  if(!clusters.length)return Object.freeze({status:'NO_MATERIAL_CLUSTER',clusters:Object.freeze([]),selectedCandidates:Object.freeze([]),deferredClusterIds:Object.freeze([]),dReplanRequests:Object.freeze([]),maxConcurrentTeachingTargets:1,capabilityClaimAllowed:false,reasonCodes:Object.freeze(['NO_GROUNDED_MATERIAL_WRITING_ISSUE'])});
  const candidates=clusters.map((cluster):WritingOpportunityCandidateV1=>Object.freeze({candidateId:cluster.clusterId,writingDimension:cluster.dimension,sourceSpan:cluster.evidenceSpans[0],targetRefs:cluster.targetRefs,facets:cluster.facets,impact:cluster.impact,scope:cluster.scope,confidence:cluster.confidence,reasonCodes:cluster.reasonCodes,evidenceRefs:Object.freeze(cluster.evidenceSpans.map(span=>span.evidenceId)),learnerIntentRequired:['MEANING_ENCODING','TASK_FULFILLMENT','PURPOSE_AUDIENCE_GENRE'].includes(cluster.dimension),rubricRelevance:cluster.rubricRelevance,possibleBottlenecks:cluster.possibleBottlenecks}));
  const budget=applyWritingFeedbackBudgetV1(candidates,{maxCandidates:input.maxVisibleCandidates??3}),selectedIds=new Set(budget.candidates.map(item=>item.candidateId));
  const replans=clusters.filter(cluster=>['TASK_BLOCKING','MEANING_BLOCKING'].includes(cluster.impact)&&!cluster.targetRefs.includes(input.authorizedTargetRef)).map(cluster=>Object.freeze({clusterId:cluster.clusterId,reason:'CRITICAL_OUT_OF_TARGET_ISSUE' as const,requestedTargetRefs:cluster.targetRefs}));
  return Object.freeze({status:'CLUSTERS_READY',clusters:Object.freeze(clusters),selectedCandidates:budget.candidates,deferredClusterIds:Object.freeze(clusters.filter(cluster=>!selectedIds.has(cluster.clusterId)).map(cluster=>cluster.clusterId)),dReplanRequests:Object.freeze(replans),maxConcurrentTeachingTargets:1,capabilityClaimAllowed:false,reasonCodes:Object.freeze(['WRITING_EVIDENCE_CLUSTERED','D_RETAINS_TARGET_AUTHORITY','H_CANNOT_WRITE_MASTERY'])});
}
