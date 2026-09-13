export interface DurableArtifactInputV1 {learnerId:string;artifactId:string;pageIndex:number;sourceUri:string;mimeType:string;sourceKind:string;mode:'WRITING'|'TRANSLATION';occurredAt:string;metadata?:unknown;operationId?:string}
export interface DurableArtifactResultV1 {artifactId:string;objectId:string;sha256:string;byteSize:number;storageUri:string}
export async function persistDurableArtifactV1(_input:DurableArtifactInputV1):Promise<DurableArtifactResultV1>{throw new Error('durable_artifact_storage_native_only_web_legacy_path_retained')}
