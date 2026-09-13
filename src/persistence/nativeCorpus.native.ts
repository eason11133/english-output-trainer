import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { defaultDatabaseDirectory, openDatabaseAsync } from 'expo-sqlite';
import { nativeCorpusManifestV1, provisionNativeCorpusV1, type NativeCorpusStateV1 } from './nativeCorpusCore';

let statePromise:Promise<NativeCorpusStateV1>|undefined;
const assetId=require('../../assets/corpus/eot-corpus-20260827.sqlite');
async function installAsset(forceOverwrite:boolean){const asset=Asset.fromModule(assetId);await asset.downloadAsync();if(!asset.localUri)throw new Error('corpus_asset_unavailable');await FileSystem.makeDirectoryAsync(defaultDatabaseDirectory,{intermediates:true});const destination=`${defaultDatabaseDirectory}/${nativeCorpusManifestV1.databaseName}`;if(forceOverwrite)await FileSystem.deleteAsync(destination,{idempotent:true});await FileSystem.copyAsync({from:asset.localUri,to:destination})}
export const nativeCorpusServiceV1={get(){return statePromise??=provisionNativeCorpusV1({open:()=>openDatabaseAsync(nativeCorpusManifestV1.databaseName,{useNewConnection:true}),installAsset})}};
