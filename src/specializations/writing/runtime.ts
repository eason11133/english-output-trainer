import type { SpecializedTeacherRuntimeV1 } from '../../architecture/contracts';
import type { LessonPlanV1 } from '../../architecture/contracts';
import type { ArtifactModeV4 } from '../../domain/stage4/LearnerRuntimeV4';

export const writingTeacherRuntimeV1:SpecializedTeacherRuntimeV1 & {supportsArtifact(mode:ArtifactModeV4,plan:LessonPlanV1):boolean}=Object.freeze({
  domain:'WRITING',
  supports(plan:LessonPlanV1){return plan.targetRef.startsWith('writing.')},
  supportsArtifact(mode:ArtifactModeV4,_plan:LessonPlanV1){return mode==='WRITING'},
});
