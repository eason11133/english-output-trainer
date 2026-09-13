import type { LearnerOutcomeV1 } from '../../teacher-runtime';
export type ExamTriageActionV1='FIX_ONLY'|'QUICK_NOTE'|'SAVE_FOR_LATER'|'MICRO_TEACH'|'DEEP_TEACH'|'TRANSFER_CHECK';
export interface ExamTriageReceiptV1{unitId:string;targetRef:string;facet:string;outcome:LearnerOutcomeV1;priority:'HIGH'|'LOW';action:ExamTriageActionV1;reasonCodes:readonly string[]}
export function triageExamUnitsV1(units:readonly {unitId:string;targetRef:string;facet:string;outcome:LearnerOutcomeV1}[],timeBudgetMinutes:number):readonly ExamTriageReceiptV1[]{
  const unresolved=units.filter(unit=>unit.outcome==='FAILURE'||unit.outcome==='PARTIAL');
  return units.map(unit=>{
    const high=unresolved[0]?.unitId===unit.unitId;
    if(unit.outcome==='SUCCESS')return{...unit,priority:'LOW' as const,action:'TRANSFER_CHECK' as const,reasonCodes:['SUCCESS_READY_FOR_FRESH_CONFIRMATION']};
    if(unit.outcome==='NOT_EVALUATED')return{...unit,priority:'LOW' as const,action:'SAVE_FOR_LATER' as const,reasonCodes:['UNCERTAIN_UNIT_NOT_TAUGHT_OR_SCORED']};
    if(high)return{...unit,priority:'HIGH' as const,action:(timeBudgetMinutes>=12?'MICRO_TEACH':'FIX_ONLY') as ExamTriageActionV1,reasonCodes:['HIGHEST_VALUE_UNRESOLVED_CANONICAL_UNIT']};
    return{...unit,priority:'LOW' as const,action:(unit.outcome==='PARTIAL'?'QUICK_NOTE':'SAVE_FOR_LATER') as ExamTriageActionV1,reasonCodes:['LOWER_VALUE_ISSUE_NOT_ALLOWED_TO_EXPAND_EPISODE']};
  });
}
