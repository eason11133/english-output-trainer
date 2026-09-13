import type { LessonPlanV1 } from '../../src/architecture/contracts';
import type { Stage4RuntimeV4 } from '../../src/domain/stage4/LearnerRuntimeV4';
import { prepareWritingFreshTaskForIntentV1 } from '../../src/specializations/writing';
import { composeTreatmentPersistenceV1 } from '../../src/persistence/treatmentChronology';
import type { PedagogicalEventV1, QualifiedInnerTutorDecisionV1 } from '../../src/teacher-runtime/types';

export function probeCombinedCompositionV1(input:{current:Stage4RuntimeV4;lessonPlan:LessonPlanV1;result:QualifiedInnerTutorDecisionV1;event:PedagogicalEventV1}){
  const {current,lessonPlan,result,event}=input;
  const configuredPriorPoint=current.decision?.configuration.decisionPointId;
  const priorPoint=current.decisionProvenance?.decisionPointId??(typeof configuredPriorPoint==='string'?configuredPriorPoint:undefined);
  const priorTrace=priorPoint?[...current.trace].reverse().find(item=>item.kind==='TEACHER_DECISION'&&item.payload.decisionPointId===priorPoint):undefined;
  const treatment=composeTreatmentPersistenceV1({
    episodeId:`episode:${current.id}:${lessonPlan.targetRef}`,
    targetRef:lessonPlan.targetRef,
    facet:lessonPlan.facet,
    currentMove:{decisionPointId:result.provenance.decisionPointId,mechanismId:result.provenance.selectedMechanismId,support:result.blockDecision.supportLevel,deliveredAt:event.occurredAt},
    priorMove:result.treatmentResponse&&priorPoint?{decisionPointId:priorPoint,mechanismId:result.treatmentResponse.mechanismId,support:result.treatmentResponse.support,deliveredAt:priorTrace?.occurredAt??result.treatmentResponse.occurredAt}:undefined,
    response:result.treatmentResponse,
  });
  const prepared=current.artifact.mode==='WRITING'&&['ASSESS','TRANSFER'].includes(result.blockDecision.pedagogicalIntent)
    ?prepareWritingFreshTaskForIntentV1({runtime:current,lessonPlan,intent:result.blockDecision.pedagogicalIntent as 'ASSESS'|'TRANSFER',occurredAt:event.occurredAt})
    :undefined;
  return{priorPoint,treatment,prepared};
}
