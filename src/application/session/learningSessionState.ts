import type {ExamBetaFamily} from '../../content/examBetaBank';

export type LearningActivityV1={id:string;taskId:string;family:ExamBetaFamily;kind:'CORE'|'UNRELATED'|'REENCOUNTER';sourceActivityId?:string};
export type LearningSessionV1={schemaVersion:1;id:string;learnerId:string;status:'ACTIVE'|'COMPLETED';activities:readonly LearningActivityV1[];currentIndex:number;completedActivityIds:readonly string[];updatedAt:string};

export function createLearningSessionV1(input:{id:string;learnerId:string;primary:{taskId:string;family:ExamBetaFamily};unrelated?:{taskId:string;family:ExamBetaFamily};reencounter?:{taskId:string;family:ExamBetaFamily};occurredAt?:string}):LearningSessionV1{
  const activities:LearningActivityV1[]=[{id:`${input.id}:core`,...input.primary,kind:'CORE'}];
  if(input.unrelated)activities.push({id:`${input.id}:unrelated`,...input.unrelated,kind:'UNRELATED'});
  if(input.reencounter)activities.push({id:`${input.id}:reencounter`,...input.reencounter,kind:'REENCOUNTER',sourceActivityId:activities[0].id});
  return{schemaVersion:1,id:input.id,learnerId:input.learnerId,status:'ACTIVE',activities,currentIndex:0,completedActivityIds:[],updatedAt:input.occurredAt??new Date().toISOString()};
}
export function currentLearningActivityV1(session:LearningSessionV1){return session.activities[session.currentIndex]}
export function advanceLearningSessionV1(session:LearningSessionV1,occurredAt=new Date().toISOString()):LearningSessionV1{
  const current=currentLearningActivityV1(session),completed=current?[...new Set([...session.completedActivityIds,current.id])]:session.completedActivityIds,next=session.currentIndex+1;
  return{...session,currentIndex:Math.min(next,session.activities.length),completedActivityIds:completed,status:next>=session.activities.length?'COMPLETED':'ACTIVE',updatedAt:occurredAt};
}
