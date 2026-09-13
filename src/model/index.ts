export type {ModelGatewayV1} from '../architecture/contracts';
export type{ModelOperationV1,ModelRetryOwnerV1,StructuredOutputRequirementV1,ModelOperationAvailabilityV1,ModelEndpointContractV1,ProductionModelEndpointContractV1,ModelUsageV1,ModelRunProvenanceV1,ModelProposalEnvelopeV1,BoundedModelGatewayV1}from'./types';
export{modelEndpointContractsV1,modelOperationContractV1,productionModelEndpointContractV1}from'./contracts';
export{guardModelProposalAuthorityV1,type ModelProposalGuardResultV1}from'./guards';
export{modelCapabilityStatesV1,modelWaveSummaryV1,type ModelCapabilityStateV1,type ModelCapabilityStatusV1}from'./capabilities';
export{waveTModelLayerStatusV1}from'./waveTStatus';
export{teacherModelRunDescriptorV1,type TeacherModelProviderOutcomeV1,type PersistedModelRunStatusV1}from'./lineage';
export const MODEL_TRUTH_RULE='Structured model output is a proposal; guards and owning subsystems decide whether it may affect execution or canonical learner truth.' as const;
