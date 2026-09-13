import { reviewWorkspaceVM, type OutputWorkspaceReviewScenario, type OutputWorkspaceVM } from '../../experience/outputWorkspaceVM';
import { productionBlockFixtureV1 } from './productionStateFixtures';

export type LessonHarnessStateV1=
  |'TODAY'|'TRANSLATION_ATTEMPT'|'TEACHER_ENTRY'|'REPLAN'|'FRESH_CHECK'|'WRITING_FOCUS'|'RESULT'|'CONTEXTUAL_LOOKUP'|'MY_ENGLISH'|'PROGRESS_HISTORY'|'READING_PRACTICE'|'FORMAL_LOCKED_ATTEMPT'
  |'HAPPY_PATH'|'WRONG_RESPONSE'|'HINT'|'RETEACH'|'RETRY'|'FRESH_FAILURE'
  |'FRESH_RETRY'|'RETURN_TO_ORIGINAL'|'LOADING'|'NETWORK_ERROR'|'INTERRUPTED_RESUME'
  |'SPELLING_RECONSTRUCTION'|'SENTENCE_BUILDER'|'FORM_MEANING_CONTRAST'|'COLLOCATION_MATCH'
  |'REWRITE_SURFACE'|'TRANSLATION_SEGMENTATION'|'CONTEXTUAL_PRODUCTION'|'FROZEN_RETURN_ORIGINAL';

export interface LessonHarnessFixtureV1{
  id:LessonHarnessStateV1;
  workspaceScenario?:OutputWorkspaceReviewScenario;
  vm?:OutputWorkspaceVM;
  transport:'READY'|'LOADING'|'ERROR';
  lifecycle:'ACTIVE'|'INTERRUPTED'|'RESUMED';
  expectedActions:readonly string[];
  productionEntry?:'TODAY'|'RESULT'|'MY_ENGLISH'|'PROGRESS_HISTORY'|'READING_PRACTICE'|'FORMAL_LOCKED_ATTEMPT'|'CONTEXTUAL_LOOKUP';
  experienceState?:string;
}

const fixture=(id:LessonHarnessStateV1,scenario:OutputWorkspaceReviewScenario|undefined,expectedActions:readonly string[],transport:LessonHarnessFixtureV1['transport']='READY',lifecycle:LessonHarnessFixtureV1['lifecycle']='ACTIVE'):LessonHarnessFixtureV1=>Object.freeze({id,workspaceScenario:scenario,vm:scenario?reviewWorkspaceVM(scenario):undefined,transport,lifecycle,expectedActions:Object.freeze(expectedActions)});
const blockFixture=(id:LessonHarnessStateV1,renderer:NonNullable<OutputWorkspaceVM['intervention']>['renderer'],payload:Record<string,unknown>,editable=false):LessonHarnessFixtureV1=>Object.freeze({id,transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['PRIMARY','STUCK']),vm:productionBlockFixtureV1(id,renderer,payload,editable)});

export const lessonHarnessFixturesV1:readonly LessonHarnessFixtureV1[]=Object.freeze([
  Object.freeze({id:'TODAY',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['START']),productionEntry:'TODAY',experienceState:'SOURCE_WORK'}),
  fixture('TRANSLATION_ATTEMPT','DELAYED_CHANGED_CONTEXT',['PRIMARY','STUCK']),
  fixture('TEACHER_ENTRY','ALLOW_ROLE_MAP',['PLACE_LANGUAGE_OBJECT','STUCK']),
  fixture('REPLAN','TEACHING_CHANGES_REPRESENTATION',['PLACE_LANGUAGE_OBJECT','STUCK']),
  fixture('FRESH_CHECK','DELAYED_CHANGED_CONTEXT',['PRIMARY']),
  fixture('WRITING_FOCUS','COMPOSITION_OVERLOAD',['PRIMARY','STUCK']),
  Object.freeze({id:'RESULT',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['CLOSE']),productionEntry:'RESULT',experienceState:'RESULT'}),
  Object.freeze({id:'CONTEXTUAL_LOOKUP',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['LOOKUP']),productionEntry:'CONTEXTUAL_LOOKUP',experienceState:'SOURCE_WORK'}),
  Object.freeze({id:'MY_ENGLISH',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze([]),productionEntry:'MY_ENGLISH',experienceState:'RESULT'}),
  Object.freeze({id:'PROGRESS_HISTORY',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze([]),productionEntry:'PROGRESS_HISTORY',experienceState:'RESULT'}),
  Object.freeze({id:'READING_PRACTICE',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['SUBMIT']),productionEntry:'READING_PRACTICE',experienceState:'SOURCE_WORK'}),
  Object.freeze({id:'FORMAL_LOCKED_ATTEMPT',transport:'READY',lifecycle:'ACTIVE',expectedActions:Object.freeze(['SUBMIT']),productionEntry:'FORMAL_LOCKED_ATTEMPT',experienceState:'SOURCE_WORK'}),
  fixture('HAPPY_PATH','CORRECT_IMMEDIATELY',['PRIMARY']),
  fixture('WRONG_RESPONSE','ALLOW_ROLE_MAP',['PLACE_LANGUAGE_OBJECT','STUCK']),
  fixture('HINT','STUCK_BEFORE_ATTEMPT',['PRIMARY']),
  fixture('RETEACH','TEACHING_CHANGES_REPRESENTATION',['PLACE_LANGUAGE_OBJECT']),
  fixture('RETRY','TEACHING_SUCCEEDS',['PRIMARY']),
  fixture('FRESH_FAILURE','COMPOSITION_OVERLOAD',['PRIMARY','STUCK']),
  fixture('FRESH_RETRY','DELAYED_CHANGED_CONTEXT',['PRIMARY']),
  fixture('RETURN_TO_ORIGINAL','VALID_ALTERNATIVE',['PRIMARY']),
  fixture('LOADING',undefined,[],'LOADING'),
  fixture('NETWORK_ERROR',undefined,['RETRY'],'ERROR'),
  fixture('INTERRUPTED_RESUME','TEACHING_SUCCEEDS',['PRIMARY'],'READY','RESUMED'),
  blockFixture('SPELLING_RECONSTRUCTION','SPELLING_RECONSTRUCTION',{target:'significant',letters:['s','i','g','n','i','f','i','c','a','n','t']},true),
  blockFixture('SENTENCE_BUILDER','SENTENCE_BUILDER',{parts:['encourage','students','to reuse','old textbooks']}),
  blockFixture('FORM_MEANING_CONTRAST','FORM_MEANING_CONTRAST',{choices:['reduce','reuse'],meanings:['讓數量變少','再次使用同一個東西'],selected:1}),
  blockFixture('COLLOCATION_MATCH','COLLOCATION_MATCH',{left:['make','pay'],right:['progress','attention']}),
  blockFixture('REWRITE_SURFACE','REWRITE_SURFACE',{original:'Many teenager war gain more attention.',constraint:'保留意思，只修這一小段。'},true),
  blockFixture('TRANSLATION_SEGMENTATION','TRANSLATION_SEGMENTATION',{segments:['這項措施','減少浪費','鼓勵更多人','重複使用產品']}),
  blockFixture('CONTEXTUAL_PRODUCTION','CONTEXTUAL_PRODUCTION',{context:'用 encourage + A + to V 寫一個跟學校生活有關的英文。'},true),
  blockFixture('FROZEN_RETURN_ORIGINAL','RETURN_TO_ORIGINAL',{original:'This measure can reduce waste and encourage more people to reduce old products.'},true),
]);

export function lessonHarnessFixtureV1(value:string|undefined):LessonHarnessFixtureV1{return lessonHarnessFixturesV1.find(item=>item.id===value)??lessonHarnessFixturesV1[0]}
