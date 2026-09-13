import type { TimeArchitectureV1 } from './types';

const BUDGETS=[5,10,20,30,60] as const;

export function resolveTimeArchitectureV1(requestedMinutes:number):TimeArchitectureV1{
  const safe=Number.isFinite(requestedMinutes)&&requestedMinutes>0?requestedMinutes:10;
  const budget=[...BUDGETS].reverse().find(value=>safe>=value)??5;
  const maxActiveFocuses:TimeArchitectureV1['maxActiveFocuses']=
    budget<=10?1:budget===20?2:budget===30?3:4;
  return{
    requestedMinutes:safe,
    budgetMinutes:budget,
    maxActiveFocuses,
    softStopAllowed:true,
    fixedSequence:false,
  };
}
