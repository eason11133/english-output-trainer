import{examPolicyCapabilityStatusV1}from'./capabilities';
export const waveSExamPolicyStatusV1=Object.freeze({wave:'S',subsystem:'Exam Product Policy',status:'READY_FOR_AUDIT' as const,capabilities:examPolicyCapabilityStatusV1,firstPass:examPolicyCapabilityStatusV1.filter(x=>x.status==='FIRST_PASS').length,contractOnly:examPolicyCapabilityStatusV1.filter(x=>x.status==='CONTRACT_ONLY').length});
