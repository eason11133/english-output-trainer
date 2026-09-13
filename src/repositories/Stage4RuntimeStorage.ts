import AsyncStorage from '@react-native-async-storage/async-storage';
import { OriginalArtifactV4, Stage4RuntimeV4 } from '../domain/stage4/LearnerRuntimeV4';
const ARTIFACTS='eot.stage4.original-artifacts.v4',RUNTIMES='eot.stage4.runtimes.v4';
const read=async<T>(key:string,fallback:T):Promise<T>=>{try{const raw=await AsyncStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}};
export async function appendOriginalArtifactV4(artifact:OriginalArtifactV4):Promise<void>{const all=await read<OriginalArtifactV4[]>(ARTIFACTS,[]),existing=all.find(item=>item.id===artifact.id);if(existing){if(JSON.stringify(existing)!==JSON.stringify(artifact))throw new Error('immutable_original_artifact_conflict');return}await AsyncStorage.setItem(ARTIFACTS,JSON.stringify([...all,artifact]))}
export async function saveStage4RuntimeV4(runtime:Stage4RuntimeV4):Promise<void>{const all=await read<Stage4RuntimeV4[]>(RUNTIMES,[]);await AsyncStorage.setItem(RUNTIMES,JSON.stringify([...all.filter(item=>item.id!==runtime.id),runtime]))}
export async function loadActiveStage4RuntimeV4(learnerId:string):Promise<Stage4RuntimeV4|null>{const all=await read<Stage4RuntimeV4[]>(RUNTIMES,[]);return[...all].reverse().find(item=>item.learnerId===learnerId&&item.status!=='COMPLETED'&&item.status!=='RETURNED')??null}
export const listStage4RuntimesV4=()=>read<Stage4RuntimeV4[]>(RUNTIMES,[]);
