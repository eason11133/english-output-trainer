export type WorkspaceRangeKind='FOCUS'|'PRESERVED';
export type WorkspaceInputScope='FULL_OUTPUT'|'FOCUSED_SPAN'|'SELECTION'|'CONSTRUCTION';
import type { ProductionConditionsV1 } from '../domain/task/TaskContract';

export type WorkspaceRenderer=
  |'ROLE_MAP'|'ROLE_CONTRAST'|'LEXICAL_RETRIEVAL'|'COMPOSITION_DECOMPOSITION'|'SHORT_FEEDBACK'
  |'SPELLING_RECONSTRUCTION'|'SENTENCE_BUILDER'|'FORM_MEANING_CONTRAST'|'COLLOCATION_MATCH'
  |'REWRITE_SURFACE'|'TRANSLATION_SEGMENTATION'|'CONTEXTUAL_PRODUCTION'|'RETURN_TO_ORIGINAL'
  |'PUZZLE_ANNOTATED_SPANS'|'PUZZLE_ROLE_RELATION'|'PUZZLE_CONTRAST'|'PUZZLE_CHUNK_GROUPING'
  |'PUZZLE_RELATION_NETWORK'|'PUZZLE_TRANSFORMATION'|'PUZZLE_REFORMULATION'|'PUZZLE_EVIDENCE_BRIDGE';

export interface OutputWorkspaceVM{
  frozenState?:'SOURCE_WORK'|'EVALUATING'|'FOCUSED_REPAIR'|'TEACHER_ENTRY'|'LEARNING_SPACE'|'REPLAN'|'SUPPORT_FADE'|'FRESH_CHECK'|'RETURN_OR_CLOSE'|'RESULT';
  experience?:{phase:string;eyebrow:string;title:string;instruction:string;timeLabel?:string;editorLabel:string;sourceLabel:string;teacher?:{state:string;message:string}};
  source?:{label?:string;text:string;canCollapse:boolean};
  output:{text:string;editable:boolean;placeholder?:string;focusedRanges?:{start:number;end:number;kind:WorkspaceRangeKind}[]};
  intervention?:{
    mechanismId:string;
    renderer:WorkspaceRenderer;
    learnerCopy:string;
    anchoredRange?:{start:number;end:number};
    supportLevel:string;
    payload:Record<string,unknown>;
  };
  nextAction:{kind:string;label?:string;inputScope:WorkspaceInputScope};
  secondaryActions:('HINT'|'IMPASSE'|'STUCK'|'CORRECT_INTENT'|'PAUSE')[];
  lookupLocked?:boolean;
  status?:{tone:'NEUTRAL'|'POSITIVE';text:string};
  productionConditions?:ProductionConditionsV1;
  focusAnchor?:{artifactId:string;start:number;end:number;excerpt:string;page?:number;before?:string;after?:string};
}

export type OutputWorkspaceReviewScenario=
  |'ALLOW_ROLE_MAP'
  |'CORRECT_IMMEDIATELY'
  |'VALID_ALTERNATIVE'
  |'LEXICAL_RETRIEVAL'
  |'TEACHING_SUCCEEDS'
  |'TEACHING_CHANGES_REPRESENTATION'
  |'COMPOSITION_OVERLOAD'
  |'STUCK_BEFORE_ATTEMPT'
  |'DELAYED_CHANGED_CONTEXT';

const focus=(text:string,needle:string)=>{
  const start=text.indexOf(needle);
  return start<0?[]:[{start,end:start+needle.length,kind:'FOCUS' as const}];
};

export function allowWorkspaceVM(input:{
  output:string;
  mechanismId:string;
  supportLevel:string;
  placed:boolean;
  representation:'ORIGINAL'|'ALTERNATIVE';
  editable:boolean;
  inputScope:WorkspaceInputScope;
  lookupLocked?:boolean;
  learnerCopy?:string;
  status?:OutputWorkspaceVM['status'];
}):OutputWorkspaceVM{
  const roleFocus=input.placed?'allow students to use':'allow to use';
  const intervention=input.mechanismId==='grammar-role-map'?{
    mechanismId:input.mechanismId,
    renderer:(input.representation==='ALTERNATIVE'?'ROLE_CONTRAST':'ROLE_MAP') as WorkspaceRenderer,
    learnerCopy:input.learnerCopy??(input.placed?'students 說清楚了「誰被允許」。':'allow 後面少了「誰被允許」。把這個角色放回句子。'),
    anchoredRange:{start:input.output.indexOf(roleFocus),end:input.output.indexOf(roleFocus)+roleFocus.length},
    supportLevel:input.supportLevel,
    payload:{placed:input.placed,languageObject:'students',actor:'Schools',verb:'allow',recipient:'students',action:'to use phones',sentence:'Schools allow students to use phones.'}
  }:undefined;
  return{
    source:{label:'原本想表達',text:'學校應該允許學生使用手機來學習。',canCollapse:false},
    output:{text:input.output,editable:input.editable,placeholder:'寫下完整英文',focusedRanges:focus(input.output,roleFocus)},
    intervention,
    nextAction:{kind:input.editable?'SUBMIT_OUTPUT':input.placed?'CONTINUE_PRODUCTION':'PLACE_LANGUAGE_OBJECT',label:input.editable?'送出這次產出':input.placed?'用另一個意思自己寫':'放入 students',inputScope:input.inputScope},
    secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],
    lookupLocked:input.lookupLocked,
    status:input.status
  };
}

export const reviewScenarioOrder:OutputWorkspaceReviewScenario[]=[
  'ALLOW_ROLE_MAP','CORRECT_IMMEDIATELY','VALID_ALTERNATIVE','LEXICAL_RETRIEVAL','TEACHING_SUCCEEDS','TEACHING_CHANGES_REPRESENTATION','COMPOSITION_OVERLOAD','STUCK_BEFORE_ATTEMPT','DELAYED_CHANGED_CONTEXT'
];

export const reviewScenarioLabels:Record<OutputWorkspaceReviewScenario,string>={
  ALLOW_ROLE_MAP:'allow 角色',CORRECT_IMMEDIATELY:'立即正確',VALID_ALTERNATIVE:'有效替代表達',LEXICAL_RETRIEVAL:'字詞想不起來',TEACHING_SUCCEEDS:'教學後再產出',TEACHING_CHANGES_REPRESENTATION:'改變教法',COMPOSITION_OVERLOAD:'寫作負荷過高',STUCK_BEFORE_ATTEMPT:'還不會',DELAYED_CHANGED_CONTEXT:'延後新情境'
};

export function reviewWorkspaceVM(scenario:OutputWorkspaceReviewScenario):OutputWorkspaceVM{
  if(scenario==='ALLOW_ROLE_MAP')return allowWorkspaceVM({output:'Schools should allow to use phones for learning.',mechanismId:'grammar-role-map',supportLevel:'GUIDED',placed:false,representation:'ORIGINAL',editable:false,inputScope:'CONSTRUCTION'});
  if(scenario==='TEACHING_SUCCEEDS')return allowWorkspaceVM({output:'Schools should allow students to use phones for learning.',mechanismId:'none',supportLevel:'GUIDED',placed:true,representation:'ORIGINAL',editable:true,inputScope:'FULL_OUTPUT',status:{tone:'NEUTRAL',text:'剛才有使用協助；接下來的句子仍由你自己完成。'}});
  if(scenario==='TEACHING_CHANGES_REPRESENTATION')return allowWorkspaceVM({output:'Schools should allow to use phones for learning.',mechanismId:'grammar-role-map',supportLevel:'EXPLICIT',placed:false,representation:'ALTERNATIVE',editable:false,inputScope:'CONSTRUCTION'});
  if(scenario==='CORRECT_IMMEDIATELY')return{source:{label:'題目',text:'說明學校手機政策。',canCollapse:false},output:{text:'Schools should allow students to use phones for learning.',editable:false},nextAction:{kind:'CLOSE',label:'回到 Today',inputScope:'FULL_OUTPUT'},secondaryActions:['PAUSE'],status:{tone:'POSITIVE',text:'這句已經清楚，不需要多加教學。'}};
  if(scenario==='VALID_ALTERNATIVE')return{source:{label:'題目',text:'說明學校手機政策。',canCollapse:false},output:{text:'Schools should permit learners to use phones for study.',editable:false},nextAction:{kind:'CLOSE',label:'繼續',inputScope:'FULL_OUTPUT'},secondaryActions:['CORRECT_INTENT','PAUSE'],status:{tone:'POSITIVE',text:'意思成立；不需要改成參考句的字樣。'}};
  if(scenario==='LEXICAL_RETRIEVAL')return{source:{label:'原本想表達',text:'這項政策帶來了顯著的改變。',canCollapse:false},output:{text:'This policy brought a _____ change.',editable:true,focusedRanges:focus('This policy brought a _____ change.','_____')},intervention:{mechanismId:'lexical-retrieval',renderer:'LEXICAL_RETRIEVAL',learnerCopy:'先找回你要的字，不改動整句。',supportLevel:'LIGHT',payload:{syllables:['sig','ni','fi','cant'],meaning:'顯著的'}},nextAction:{kind:'SUBMIT_OUTPUT',label:'把字放回原句',inputScope:'FOCUSED_SPAN'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE']};
  if(scenario==='COMPOSITION_OVERLOAD')return{source:{label:'原本想表達',text:'這不只減少浪費，也鼓勵更多人重複使用物品。',canCollapse:true},output:{text:'This not only decline waste but also encourage many people reduce.',editable:true,focusedRanges:focus('This not only decline waste but also encourage many people reduce.','decline waste')},intervention:{mechanismId:'meaning-decomposition',renderer:'COMPOSITION_DECOMPOSITION',learnerCopy:'先保留你的兩個意思，只處理每一小段缺少的部分。',supportLevel:'MEDIUM',payload:{lines:['This not only reduce ___','but also encourage ___ to ___']}},nextAction:{kind:'SUBMIT_OUTPUT',label:'先完成這兩小段',inputScope:'FOCUSED_SPAN'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE']};
  if(scenario==='STUCK_BEFORE_ATTEMPT')return{source:{label:'題目',text:'圖書館應該允許訪客使用電腦。',canCollapse:false},output:{text:'',editable:true,placeholder:'從你知道的部分開始'},intervention:{mechanismId:'pre-attempt-role-cue',renderer:'SHORT_FEEDBACK',learnerCopy:'你還沒有答錯。先決定：誰允許、允許誰、做什麼。',supportLevel:'LIGHT',payload:{lines:['誰允許：圖書館','允許誰：訪客','做什麼：使用電腦']}},nextAction:{kind:'SUBMIT_OUTPUT',label:'寫出我的句子',inputScope:'FULL_OUTPUT'},secondaryActions:['CORRECT_INTENT','PAUSE']};
  return{source:{label:'新的情境',text:'公司應該允許員工在家工作。',canCollapse:false},output:{text:'',editable:true,placeholder:'Write your sentence…'},nextAction:{kind:'SUBMIT_OUTPUT',label:'送出',inputScope:'FULL_OUTPUT'},secondaryActions:['STUCK','CORRECT_INTENT','PAUSE'],lookupLocked:true};
}
