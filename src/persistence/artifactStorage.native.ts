import { Directory, File, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { createOperationalIdV1, fingerprintV1 } from './identity';
import { operationalDatabaseV1 } from './operationalDatabase';

const hex=(value:ArrayBuffer)=>Array.from(new Uint8Array(value),byte=>byte.toString(16).padStart(2,'0')).join('');
const safeExtension=(name:string)=>{const match=/([.][a-z0-9]{1,10})$/i.exec(name);return match?.[1]?.toLowerCase()??'.bin'};

export interface DurableArtifactInputV1 {learnerId:string;artifactId:string;pageIndex:number;sourceUri:string;mimeType:string;sourceKind:string;mode:'WRITING'|'TRANSLATION';occurredAt:string;metadata?:unknown;operationId?:string}
export interface DurableArtifactResultV1 {artifactId:string;objectId:string;sha256:string;byteSize:number;storageUri:string}

export async function persistDurableArtifactV1(input:DurableArtifactInputV1):Promise<DurableArtifactResultV1>{
  const source=new File(input.sourceUri);
  if(!source.exists)throw new Error(`artifact_source_missing:${input.sourceUri}`);
  const root=new Directory(Paths.document,'eot-artifacts-v1'),staging=new Directory(root,'staging'),objects=new Directory(root,'objects');
  root.create({idempotent:true,intermediates:true});staging.create({idempotent:true,intermediates:true});objects.create({idempotent:true,intermediates:true});
  const stage=new File(staging,`${createOperationalIdV1('stage')}${safeExtension(source.name)}`);
  await source.copy(stage);
  try{
    const bytes=await stage.arrayBuffer(),sha256=hex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256,bytes));
    const shard=new Directory(objects,sha256.slice(0,2));shard.create({idempotent:true,intermediates:true});
    const finalFile=new File(shard,`${sha256}${safeExtension(source.name)}`);
    if(!finalFile.exists)await stage.move(finalFile);else stage.delete();
    if(!finalFile.exists||finalFile.size!==bytes.byteLength)throw new Error('artifact_finalization_verification_failed');
    const objectId=`sha256:${sha256}`,operationId=input.operationId??createOperationalIdV1('op');
    await operationalDatabaseV1.commitArtifactIntake({envelope:{operationId,learnerId:input.learnerId,occurredAt:input.occurredAt,inputFingerprint:await fingerprintV1({...input,operationId:undefined,sourceUri:undefined,sha256})},artifactId:input.artifactId,pageIndex:input.pageIndex,objectId,sha256,byteSize:bytes.byteLength,mimeType:input.mimeType,storagePath:finalFile.uri,sourceKind:input.sourceKind,mode:input.mode,originalUri:input.sourceUri,metadata:input.metadata??{}});
    return{artifactId:input.artifactId,objectId,sha256,byteSize:bytes.byteLength,storageUri:finalFile.uri};
  }catch(error){if(stage.exists)stage.delete();throw error}
}
