import AsyncStorage from '@react-native-async-storage/async-storage';
import {currentLearningActivityV1,type LearningSessionV1} from './learningSessionState';
export * from './learningSessionState';
const key=(learnerId:string)=>`eot.learning-session.v1:${learnerId}`;
export async function saveLearningSessionV1(session:LearningSessionV1){await AsyncStorage.setItem(key(session.learnerId),JSON.stringify(session))}
export async function loadActiveLearningSessionV1(learnerId:string):Promise<LearningSessionV1|null>{try{const raw=await AsyncStorage.getItem(key(learnerId));if(!raw)return null;const value=JSON.parse(raw)as LearningSessionV1;return value.schemaVersion===1&&value.learnerId===learnerId&&value.status==='ACTIVE'&&Boolean(currentLearningActivityV1(value))?value:null}catch{return null}}
