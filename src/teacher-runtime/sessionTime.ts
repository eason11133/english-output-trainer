import type { Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';

const msPerMinute=60_000;

export function startTutorSessionV1(runtime:Stage4RuntimeV4,budgetMinutes:number,now=new Date().toISOString()):Stage4RuntimeV4{
  if(runtime.tutorSession)return runtime;
  return{...runtime,tutorSession:{startedAt:now,budgetMinutes,accumulatedPausedMs:0}};
}

export function pauseTutorSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  if(!runtime.tutorSession||runtime.tutorSession.pausedAt)return runtime;
  return{...runtime,tutorSession:{...runtime.tutorSession,pausedAt:now}};
}

export function resumeTutorSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  const session=runtime.tutorSession;
  if(!session?.pausedAt)return runtime;
  const pausedMs=Math.max(0,Date.parse(now)-Date.parse(session.pausedAt));
  return{...runtime,tutorSession:{...session,pausedAt:undefined,accumulatedPausedMs:session.accumulatedPausedMs+pausedMs}};
}

export function tutorTimeRemainingMinutesV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):number{
  const session=runtime.tutorSession;
  if(!session)return 0;
  const effectiveNow=Date.parse(session.pausedAt??now);
  const elapsedMs=Math.max(0,effectiveNow-Date.parse(session.startedAt)-session.accumulatedPausedMs);
  return Math.max(0,session.budgetMinutes-elapsedMs/msPerMinute);
}

export function endTutorSessionV1(runtime:Stage4RuntimeV4,now=new Date().toISOString()):Stage4RuntimeV4{
  return runtime.tutorSession?{...runtime,tutorSession:{...runtime.tutorSession,endedAt:now}}:runtime;
}
