import type {ExamBetaFamily} from '../../content/examBetaBank';

export type LearningActivityV1={id:string;taskId:string;family:ExamBetaFamily;kind:'CORE'|'NEW_WORK'|'TREATMENT'|'UNRELATED'|'REENCOUNTER';sourceActivityId?:string};
export type LearningSessionV1={schemaVersion:1;id:string;learnerId:string;status:'ACTIVE'|'COMPLETED';origin:'TODAY'|'PRACTICE'|'MY_ENGLISH';intendedMinutes:number;startedAt:string;activities:readonly LearningActivityV1[];currentIndex:number;completedActivityIds:readonly string[];updatedAt:string};

export function createLearningSessionV1(input:{id:string;learnerId:string;primary:{taskId:string;family:ExamBetaFamily};origin?:LearningSessionV1['origin'];intendedMinutes?:number;unrelated?:{taskId:string;family:ExamBetaFamily};reencounter?:{taskId:string;family:ExamBetaFamily};occurredAt?:string}):LearningSessionV1{
  const activities:LearningActivityV1[]=[{id:`${input.id}:core`,...input.primary,kind:'CORE'}];
  if(input.unrelated)activities.push({id:`${input.id}:unrelated`,...input.unrelated,kind:'UNRELATED'});
  if(input.reencounter)activities.push({id:`${input.id}:reencounter`,...input.reencounter,kind:'REENCOUNTER',sourceActivityId:activities[0].id});
  const occurredAt=input.occurredAt??new Date().toISOString();
  return{schemaVersion:1,id:input.id,learnerId:input.learnerId,status:'ACTIVE',origin:input.origin??'TODAY',intendedMinutes:input.intendedMinutes??20,startedAt:occurredAt,activities,currentIndex:0,completedActivityIds:[],updatedAt:occurredAt};
}
export function currentLearningActivityV1(session:LearningSessionV1){return session.activities[session.currentIndex]}
export function advanceLearningSessionV1(session:LearningSessionV1,occurredAt=new Date().toISOString()):LearningSessionV1{
  const current=currentLearningActivityV1(session),completed=current?[...new Set([...session.completedActivityIds,current.id])]:session.completedActivityIds,next=session.currentIndex+1;
  return{...session,currentIndex:Math.min(next,session.activities.length),completedActivityIds:completed,status:next>=session.activities.length?'COMPLETED':'ACTIVE',updatedAt:occurredAt};
}

export function appendLearningActivityV1(session:LearningSessionV1,activity:Omit<LearningActivityV1,'id'>,occurredAt=new Date().toISOString()):LearningSessionV1{
  if(session.status==='COMPLETED')return session;
  const ordinal=session.activities.length+1;
  return{...session,activities:[...session.activities,{...activity,id:`${session.id}:activity-${ordinal}`}],updatedAt:occurredAt};
}

export function closeLearningSessionV1(session:LearningSessionV1,occurredAt=new Date().toISOString()):LearningSessionV1{
  const current=currentLearningActivityV1(session),completed=current?[...new Set([...session.completedActivityIds,current.id])]:session.completedActivityIds;
  return{...session,currentIndex:session.activities.length,completedActivityIds:completed,status:'COMPLETED',updatedAt:occurredAt};
}
