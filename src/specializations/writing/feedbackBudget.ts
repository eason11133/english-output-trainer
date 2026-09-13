import type { WritingOpportunityCandidateV1 } from './types';

const impactScore:Record<WritingOpportunityCandidateV1['impact'],number>={TASK_BLOCKING:100,MEANING_BLOCKING:90,HIGH:70,MEDIUM:40,LOW:10};
const scopeScore:Record<WritingOpportunityCandidateV1['scope'],number>={GLOBAL:20,PARAGRAPH:15,SENTENCE:10,PHRASE:5,TOKEN:0};
const confidenceScore:Record<WritingOpportunityCandidateV1['confidence'],number>={HIGH:10,MEDIUM:4,LOW:-20};

export interface WritingFeedbackBudgetResultV1{
  candidates:readonly WritingOpportunityCandidateV1[];
  hiddenCount:number;
  maxConcurrentTeachingTargets:1;
  reasonCodes:readonly string[];
}

export function applyWritingFeedbackBudgetV1(candidates:readonly WritingOpportunityCandidateV1[],options:{maxCandidates?:number}={}):WritingFeedbackBudgetResultV1{
  const max=Math.max(1,Math.min(options.maxCandidates??3,5));
  const ranked=[...candidates].sort((a,b)=>{
    const sa=impactScore[a.impact]+scopeScore[a.scope]+confidenceScore[a.confidence]+(a.targetRefs.length?3:0);
    const sb=impactScore[b.impact]+scopeScore[b.scope]+confidenceScore[b.confidence]+(b.targetRefs.length?3:0);
    return sb-sa||a.candidateId.localeCompare(b.candidateId);
  });
  const visible=ranked.slice(0,max);
  return Object.freeze({candidates:Object.freeze(visible),hiddenCount:Math.max(0,ranked.length-visible.length),maxConcurrentTeachingTargets:1,reasonCodes:Object.freeze(['WRITING_FEEDBACK_BOUNDED','D_RETAINS_TARGET_AUTHORITY','F_RETAINS_ONE_TARGET_TEACHING_BUDGET'])});
}
