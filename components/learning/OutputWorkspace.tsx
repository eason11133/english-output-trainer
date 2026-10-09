import { eotLearnerTokensV1 as woodTheme } from '../../src/ui/tokens';
import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OutputWorkspaceVM } from '../../src/experience/outputWorkspaceVM';
import { eotLearnerTokensV1 as t } from '../../src/ui';
import { UniversalLookupText } from './UniversalLookupText';

type Props={
  vm:OutputWorkspaceVM;
  value:string;
  onChangeText:(value:string)=>void;
  onPrimary:()=>void;
  onPlaceLanguageObject?:()=>void;
  onStuck?:()=>void;
  onHint?:()=>void;
  onTryIndependent?:()=>void;
  onBlockEvent?:(event:{type:'ITEM_MOVED'|'ITEM_REORDERED'|'OPTION_SELECTED';value:string;index:number})=>void;
  onCorrectIntent?:()=>void;
  onPause?:()=>void;
  lookup?:React.ReactNode;
  feedback?:string;
  onSourceTokenPress?:(tap:{text:string;start:number;end:number;surroundingText:string})=>void;
  onDraftLookupUsed?:(result:{senseId?:string;lemma?:string})=>void;
};

export function OutputWorkspace({vm,value,onChangeText,onPrimary,onPlaceLanguageObject,onStuck,onHint,onTryIndependent,onBlockEvent,onCorrectIntent,lookup,feedback,onSourceTokenPress,onDraftLookupUsed}:Props){
  return <View style={s.workspace} accessibilityLabel="英文練習" testID={vm.frozenState?`exam-workspace-${vm.frozenState.toLowerCase()}`:'output-workspace'}>
    {vm.source?<SourceContext label={vm.source.label??vm.experience?.sourceLabel} text={vm.source.text} onTokenPress={onSourceTokenPress}/>:null}
    <Text style={s.label}>{vm.experience?.editorLabel??'你的英文'}</Text>
    <View style={s.editor}>
      {vm.output.editable?<TextInput accessibilityLabel={vm.experience?.editorLabel??'你的英文輸出'} multiline value={value} onChangeText={onChangeText} placeholder={vm.output.placeholder??'寫下完整英文'} placeholderTextColor={woodTheme.colors.subtle} style={s.editorInput}/>:<FocusedOutput vm={vm}/>} 
    </View>
    {vm.output.editable&&value.trim()&&!vm.lookupLocked?<View style={s.lookup}><Text style={s.sourceLabel}>你寫的英文（選看片語或字詞）</Text><UniversalLookupText text={value} sourceFamily="WRITING" responsePhase="PRE_RESPONSE" onLookupUsed={onDraftLookupUsed}/></View>:null}
    {vm.intervention?<InlineIntervention intervention={vm.intervention} onPlace={onPlaceLanguageObject} onBlockEvent={onBlockEvent}/>:null}
    {vm.status?<View style={[s.status,vm.status.tone==='POSITIVE'&&s.statusPositive]}><View style={[s.statusDot,vm.status.tone==='POSITIVE'&&s.statusDotPositive]}/><Text style={s.statusText}>{vm.status.text}</Text></View>:null}
    {feedback?<Text accessibilityRole="alert" style={s.feedback}>{feedback}</Text>:null}
    {!vm.lookupLocked&&lookup?<View style={s.lookup}>{lookup}</View>:null}
    {vm.nextAction.label&&vm.nextAction.kind!=='PLACE_LANGUAGE_OBJECT'?<Pressable accessibilityRole="button" disabled={vm.output.editable&&!value.trim()} onPress={onPrimary} style={[s.primary,vm.output.editable&&!value.trim()&&s.disabled]}><Text style={s.primaryText}>{vm.nextAction.label}</Text></Pressable>:null}
    <View style={s.secondaryRow}>
      {(vm.secondaryActions.includes('HINT')||vm.secondaryActions.includes('STUCK'))&&onHint?<Pressable accessibilityRole="button" onPress={onHint} style={s.secondary}><Text style={s.secondaryText}>給我提示</Text></Pressable>:null}
      {(vm.secondaryActions.includes('IMPASSE')||vm.secondaryActions.includes('STUCK'))&&onStuck?<Pressable accessibilityRole="button" onPress={onStuck} style={s.secondary}><Text style={s.secondaryText}>還是不會</Text></Pressable>:null}
      {onTryIndependent?<Pressable accessibilityRole="button" onPress={onTryIndependent} style={s.secondary}><Text style={s.secondaryText}>拿掉提示，我自己試</Text></Pressable>:null}
      {vm.secondaryActions.includes('CORRECT_INTENT')&&onCorrectIntent?<Pressable accessibilityRole="button" onPress={onCorrectIntent} style={s.secondary}><Text style={s.secondaryText}>意思不是這樣</Text></Pressable>:null}
    </View>
  </View>;
}

function SourceContext({label,text,onTokenPress}:{label?:string;text:string;onTokenPress?:Props['onSourceTokenPress']}){const parts=[...text.matchAll(/[A-Za-z]+(?:['’-][A-Za-z]+)?|[^A-Za-z]+/g)];return <View style={s.source}><Text style={s.sourceLabel}>{label??'題目'}</Text>{onTokenPress?<Text style={s.sourceText}>{parts.map((match,index)=>/^[A-Za-z]/.test(match[0])?<Text accessibilityRole="button" key={`${match.index}-${index}`} onPress={()=>onTokenPress({text:match[0],start:match.index!,end:match.index!+match[0].length,surroundingText:text})}>{match[0]}</Text>:<Text key={`${match.index}-${index}`}>{match[0]}</Text>)}</Text>:<Text style={s.sourceText}>{text}</Text>}</View>}

function FocusedOutput({vm}:{vm:OutputWorkspaceVM}){
  const range=vm.output.focusedRanges?.find(item=>item.kind==='FOCUS');
  if(!range)return <Text style={s.outputText}>{vm.output.text}</Text>;
  return <Text style={s.outputText}>{vm.output.text.slice(0,range.start)}<Text style={s.focus}>{vm.output.text.slice(range.start,range.end)}</Text>{vm.output.text.slice(range.end)}</Text>;
}

function InlineIntervention({intervention,onPlace,onBlockEvent}:{intervention:NonNullable<OutputWorkspaceVM['intervention']>;onPlace?:()=>void;onBlockEvent?:Props['onBlockEvent']}){
  return <View style={s.intervention}>
    <View style={s.teacherBody}><Text style={s.teacherCopy}>{intervention.learnerCopy}</Text>
    {intervention.renderer==='ROLE_MAP'?<RoleMap payload={intervention.payload} onPlace={onPlace}/>:null}
    {intervention.renderer==='ROLE_CONTRAST'?<RoleContrast payload={intervention.payload}/>:null}
    {intervention.renderer==='LEXICAL_RETRIEVAL'?<LexicalRetrieval payload={intervention.payload}/>:null}
    {intervention.renderer==='COMPOSITION_DECOMPOSITION'?<Lines payload={intervention.payload}/>:null}
    {intervention.renderer==='SHORT_FEEDBACK'?<Lines payload={intervention.payload}/>:null}
    {intervention.renderer==='SPELLING_RECONSTRUCTION'?<SpellingReconstruction payload={intervention.payload}/>:null}
    {intervention.renderer==='SENTENCE_BUILDER'?<SentenceBuilder payload={intervention.payload} onSelect={(value,index)=>onBlockEvent?.({type:'ITEM_REORDERED',value,index})}/>:null}
    {intervention.renderer==='FORM_MEANING_CONTRAST'?<ChoiceContrast payload={intervention.payload}/>:null}
    {intervention.renderer==='COLLOCATION_MATCH'?<CollocationMatch payload={intervention.payload} onSelect={(value,index)=>onBlockEvent?.({type:'OPTION_SELECTED',value,index})}/>:null}
    {intervention.renderer==='REWRITE_SURFACE'?<RewriteSurface payload={intervention.payload}/>:null}
    {intervention.renderer==='TRANSLATION_SEGMENTATION'?<MeaningSegments payload={intervention.payload} onSelect={(value,index)=>onBlockEvent?.({type:'ITEM_MOVED',value,index})}/>:null}
    {intervention.renderer==='CONTEXTUAL_PRODUCTION'?<ContextualProduction payload={intervention.payload}/>:null}
    {intervention.renderer==='RETURN_TO_ORIGINAL'?<ReturnOriginal payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_ANNOTATED_SPANS'?<PuzzleAnnotatedSpans payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_ROLE_RELATION'?<PuzzleRoleRelation payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_CONTRAST'?<PuzzleContrast payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_CHUNK_GROUPING'?<PuzzleChunkGrouping payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_RELATION_NETWORK'?<PuzzleRelationNetwork payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_TRANSFORMATION'?<PuzzleTransformation payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_REFORMULATION'?<PuzzleReformulation payload={intervention.payload}/>:null}
    {intervention.renderer==='PUZZLE_EVIDENCE_BRIDGE'?<PuzzleEvidenceBridge payload={intervention.payload}/>:null}</View>
  </View>;
}

function RoleMap({payload,onPlace}:{payload:Record<string,unknown>;onPlace?:()=>void}){
  const placed=payload.placed===true;
  const verb=typeof payload.verb==='string'?payload.verb:'';
  const recipient=typeof payload.recipient==='string'?payload.recipient:'';
  const action=typeof payload.action==='string'?payload.action:'';
  return <View style={s.micro}>
    <View style={s.formula}><Text style={s.word}>{verb}</Text><Pressable accessibilityRole="button" accessibilityLabel={placed?`${recipient} 已放入被允許者位置`:`把 ${recipient} 放入被允許者位置`} disabled={placed} onPress={onPlace} style={[s.slot,placed&&s.slotFilled]}><Text style={s.slotText}>{placed?recipient:'誰被允許？'}</Text></Pressable><Text style={s.actionPhrase}>{action}</Text></View>
    {!placed?<View style={s.objectTray}><Pressable accessibilityRole="button" onPress={onPlace} style={s.languageObject}><Text style={s.languageObjectText}>{recipient}</Text></Pressable><Text style={s.microHint}>點一下，把它放回句子</Text></View>:<Text style={s.microHint}>句子已重新組合；這次操作是教學，不是能力證明。</Text>}
  </View>;
}

function RoleContrast({payload}:{payload:Record<string,unknown>}){const actor=typeof payload.actor==='string'?payload.actor:'';const recipient=typeof payload.recipient==='string'?payload.recipient:'';const action=typeof payload.action==='string'?payload.action:'';const sentence=typeof payload.sentence==='string'?payload.sentence:'';return <View style={s.micro}><View style={s.contrastRow}><Role label="誰做決定" value={actor}/><Text style={s.arrow}>→</Text><Role label="影響誰" value={recipient}/><Text style={s.arrow}>→</Text><Role label="做什麼" value={action}/></View>{sentence?<Text style={s.contrastSentence}>{sentence}</Text>:null}</View>}
function Role({label,value}:{label:string;value:string}){return <View style={s.role}><Text style={s.roleLabel}>{label}</Text><Text style={s.roleValue}>{value}</Text></View>}
function LexicalRetrieval({payload}:{payload:Record<string,unknown>}){const syllables=Array.isArray(payload.syllables)?payload.syllables.map(String):[];return <View style={s.micro}><Text style={s.microHint}>{String(payload.meaning??'')}</Text><View style={s.syllables}>{syllables.map(item=><Text key={item} style={s.syllable}>{item}</Text>)}</View></View>}
function Lines({payload}:{payload:Record<string,unknown>}){const lines=Array.isArray(payload.lines)?payload.lines.map(String):[];return <View style={s.micro}>{lines.map(line=><Text key={line} style={s.line}>{line}</Text>)}</View>}
const strings=(value:unknown)=>Array.isArray(value)?value.map(String):[];
function SpellingReconstruction({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}><Text style={s.blockTarget}>{String(payload.target??'')}</Text><View style={s.tileRow}>{strings(payload.letters).map((item,index)=><View key={`${item}-${index}`} style={s.letterTile}><Text style={s.tileText}>{item}</Text></View>)}</View><Text style={s.microHint}>可用鍵盤輸入；不需要拖曳。</Text></View>}
function SentenceBuilder({payload,onSelect}:{payload:Record<string,unknown>;onSelect?:(value:string,index:number)=>void}){return <View style={s.micro}><View style={s.tileRow}>{strings(payload.parts).map((item,index)=><Pressable accessibilityRole="button" accessibilityLabel={`選取句子片段 ${item}`} onPress={()=>onSelect?.(item,index)} key={`${item}-${index}`} style={s.phraseTile}><Text style={s.tileText}>{item}</Text></Pressable>)}</View><Text style={s.microHint}>依序點選或用鍵盤啟用片段；不需要拖曳。</Text></View>}
function ChoiceContrast({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}>{strings(payload.choices).map((item,index)=><View key={item} style={[s.contrastChoice,index===Number(payload.selected)&&s.contrastChoiceOn]}><Text style={s.tileText}>{item}</Text><Text style={s.microHint}>{strings(payload.meanings)[index]??''}</Text></View>)}</View>}
function CollocationMatch({payload,onSelect}:{payload:Record<string,unknown>;onSelect?:(value:string,index:number)=>void}){const items=[...strings(payload.left),...strings(payload.right)];return <View style={s.micro}><View style={s.matchGrid}>{items.map((item,index)=><Pressable accessibilityRole="button" accessibilityLabel={`選取搭配項目 ${item}`} onPress={()=>onSelect?.(item,index)} key={`${index}-${item}`} style={s.matchItem}><Text style={s.tileText}>{item}</Text></Pressable>)}</View><Text style={s.microHint}>逐項點選或用鍵盤啟用來配對；不需要拖曳。</Text></View>}
function RewriteSurface({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}><Text style={s.originalLine}>{String(payload.original??'')}</Text><Text style={s.microHint}>{String(payload.constraint??'保留原意，只修改標示的一小段。')}</Text></View>}
function MeaningSegments({payload,onSelect}:{payload:Record<string,unknown>;onSelect?:(value:string,index:number)=>void}){return <View style={s.micro}>{strings(payload.segments).map((item,index)=><Pressable accessibilityRole="button" accessibilityLabel={`選取意思片段 ${index+1} ${item}`} onPress={()=>onSelect?.(item,index)} key={`${item}-${index}`} style={s.segmentRow}><Text style={s.segmentLabel}>{index+1}</Text><Text style={s.tileText}>{item}</Text></Pressable>)}</View>}
function ContextualProduction({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}><Text style={s.blockTarget}>{String(payload.context??'')}</Text><Text style={s.microHint}>沒有顯示參考答案；請用自己的英文完成。</Text></View>}
function ReturnOriginal({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}><Text style={s.originalLine}>{String(payload.original??'')}</Text><View style={s.returnMark}/><Text style={s.microHint}>游標會回到原作附近，但不會預先填入修改答案。</Text></View>}
const objectArray=(value:unknown)=>Array.isArray(value)?value.filter(item=>item&&typeof item==='object') as Record<string,unknown>[]:[];
function PuzzleAnnotatedSpans({payload}:{payload:Record<string,unknown>}){const segments=objectArray(payload.segments);return <View style={s.micro}>{segments.map((segment,index)=><View key={index} style={s.puzzleStrip}>{segment.label?<Text style={s.puzzleCaption}>{String(segment.label)}</Text>:null}<Text style={[s.puzzleText,segment.emphasis===true&&s.puzzleStrong]}>{String(segment.text??'')}</Text></View>)}</View>}
function PuzzleRoleRelation({payload}:{payload:Record<string,unknown>}){const nodes=objectArray(payload.nodes);return <View style={s.micro}><View style={s.puzzleChain}>{nodes.map((node,index)=><React.Fragment key={String(node.id??index)}><View style={s.puzzleNode}><Text style={s.puzzleText}>{String(node.label??'')}</Text>{node.detail?<Text style={s.microHint}>{String(node.detail)}</Text>:null}</View>{index<nodes.length-1?<Text style={s.arrow}>→</Text>:null}</React.Fragment>)}</View></View>}
function PuzzleContrast({payload}:{payload:Record<string,unknown>}){const left=(payload.left??{}) as Record<string,unknown>,right=(payload.right??{}) as Record<string,unknown>;return <View style={s.puzzleColumns}><View style={s.puzzleColumn}>{left.title?<Text style={s.puzzleCaption}>{String(left.title)}</Text>:null}{strings(left.lines).map((line,index)=><Text key={index} style={s.puzzleText}>{line}</Text>)}</View><View style={s.puzzleColumn}>{right.title?<Text style={s.puzzleCaption}>{String(right.title)}</Text>:null}{strings(right.lines).map((line,index)=><Text key={index} style={s.puzzleText}>{line}</Text>)}</View></View>}
function PuzzleChunkGrouping({payload}:{payload:Record<string,unknown>}){const groups=objectArray(payload.groups);return <View style={s.micro}>{groups.map((group,index)=><View key={index} style={s.puzzleGroup}>{group.label?<Text style={s.puzzleCaption}>{String(group.label)}</Text>:null}<View style={s.tileRow}>{strings(group.items).map((item,i)=><View key={`${index}-${i}`} style={s.phraseTile}><Text style={s.tileText}>{item}</Text></View>)}</View></View>)}</View>}
function PuzzleRelationNetwork({payload}:{payload:Record<string,unknown>}){const nodes=objectArray(payload.nodes),edges=objectArray(payload.edges),byId=new Map(nodes.map(node=>[String(node.id??''),String(node.label??'')]));return <View style={s.micro}>{nodes.map((node,index)=><View key={index} style={s.puzzleNode}><Text style={s.puzzleText}>{String(node.label??'')}</Text>{node.detail?<Text style={s.microHint}>{String(node.detail)}</Text>:null}</View>)}{edges.map((edge,index)=><Text key={`e-${index}`} style={s.puzzleEdge}>{byId.get(String(edge.from??''))??String(edge.from??'')} → {byId.get(String(edge.to??''))??String(edge.to??'')}{edge.label?` · ${String(edge.label)}`:''}</Text>)}</View>}
function PuzzleTransformation({payload}:{payload:Record<string,unknown>}){const steps=objectArray(payload.steps);return <View style={s.micro}>{steps.map((step,index)=><View key={index} style={s.puzzleStrip}>{step.before?<Text style={s.originalLine}>{String(step.before)}</Text>:null}<Text style={s.puzzleArrow}>↓</Text><Text style={s.puzzleStrong}>{String(step.after??'')}</Text>{step.note?<Text style={s.microHint}>{String(step.note)}</Text>:null}</View>)}</View>}
function PuzzleReformulation({payload}:{payload:Record<string,unknown>}){const alternatives=objectArray(payload.alternatives);return <View style={s.micro}><Text style={s.originalLine}>{String(payload.base??'')}</Text>{alternatives.map((item,index)=><View key={index} style={s.puzzleStrip}><Text style={s.puzzleText}>{String(item.text??'')}</Text>{item.note?<Text style={s.microHint}>{String(item.note)}</Text>:null}</View>)}</View>}
function PuzzleEvidenceBridge({payload}:{payload:Record<string,unknown>}){return <View style={s.micro}><Text style={s.puzzleCaption}>要判斷的內容</Text><Text style={s.puzzleStrong}>{String(payload.claim??'')}</Text><Text style={[s.puzzleCaption,{marginTop:12}]}>可以用的證據</Text>{strings(payload.evidence).map((item,index)=><Text key={index} style={s.puzzleText}>• {item}</Text>)}{payload.bridge?<View style={s.puzzleStrip}><Text style={s.puzzleCaption}>中間關係</Text><Text style={s.puzzleText}>{String(payload.bridge)}</Text></View>:null}</View>}

const s=StyleSheet.create({
  workspace:{alignSelf:'stretch',paddingTop:8,paddingBottom:t.spacing.lg},label:{fontSize:12,lineHeight:18,fontWeight:'500',color:t.colors.muted,marginBottom:8},source:{borderBottomWidth:1,borderBottomColor:woodTheme.colors.line,paddingBottom:20,marginBottom:24},sourceLabel:{fontSize:12,lineHeight:18,fontWeight:'500',color:woodTheme.colors.muted,marginBottom:8},sourceText:{fontSize:17,lineHeight:27,color:woodTheme.colors.ink},
  editor:{borderBottomWidth:1,borderBottomColor:woodTheme.colors.dividerStrong,paddingVertical:14},outputText:{fontSize:17,lineHeight:27,color:woodTheme.colors.ink},focus:{borderBottomWidth:2,borderBottomColor:woodTheme.colors.focus,backgroundColor:woodTheme.colors.focusWash},editorInput:{minHeight:128,padding:0,fontSize:17,lineHeight:27,color:woodTheme.colors.ink,textAlignVertical:'top'},
  intervention:{marginTop:24},teacherBody:{flex:1},teacherCopy:{fontSize:16,lineHeight:24,color:woodTheme.colors.ink},micro:{marginTop:16,paddingVertical:8},formula:{flexDirection:'row',alignItems:'center',gap:7,flexWrap:'wrap'},word:{paddingVertical:7,paddingHorizontal:9,borderRadius:8,backgroundColor:woodTheme.colors.woodWash,borderWidth:1,borderColor:woodTheme.colors.line,fontSize:15,fontWeight:'600',color:woodTheme.colors.deepWood},slot:{minHeight:44,minWidth:116,paddingHorizontal:10,borderWidth:1.5,borderStyle:'dashed',borderColor:woodTheme.colors.lightWood,borderRadius:8,alignItems:'center',justifyContent:'center',backgroundColor:woodTheme.colors.paper},slotFilled:{borderStyle:'solid',backgroundColor:woodTheme.colors.woodWash},slotText:{fontSize:12,fontWeight:'600',color:woodTheme.colors.midWood},actionPhrase:{fontSize:15,color:woodTheme.colors.muted},objectTray:{marginTop:12,flexDirection:'row',alignItems:'center',gap:9,flexWrap:'wrap'},languageObject:{minHeight:44,paddingHorizontal:14,borderWidth:1,borderColor:woodTheme.colors.lightWood,borderRadius:8,alignItems:'center',justifyContent:'center',backgroundColor:woodTheme.colors.paper},languageObjectText:{fontSize:14,fontWeight:'600',color:woodTheme.colors.ink},microHint:{fontSize:12,lineHeight:18,color:woodTheme.colors.subtle},
  contrastRow:{flexDirection:'row',alignItems:'stretch',gap:4},role:{flex:1,minWidth:0,padding:8,backgroundColor:woodTheme.colors.woodWash,borderTopWidth:2,borderTopColor:woodTheme.colors.midWood},roleLabel:{fontSize:9,color:woodTheme.colors.subtle},roleValue:{fontSize:13,fontWeight:'700',color:woodTheme.colors.ink,marginTop:4},arrow:{alignSelf:'center',color:woodTheme.colors.midWood},contrastSentence:{marginTop:12,fontSize:17,lineHeight:25,textAlign:'center',color:woodTheme.colors.ink},syllables:{flexDirection:'row',gap:5,marginTop:8,flexWrap:'wrap'},syllable:{paddingVertical:6,paddingHorizontal:8,borderRadius:8,backgroundColor:woodTheme.colors.woodWash,color:woodTheme.colors.deepWood,fontWeight:'700'},line:{paddingVertical:6,fontSize:15,lineHeight:22,color:woodTheme.colors.ink},
  puzzleStrip:{paddingVertical:10,borderBottomWidth:1,borderBottomColor:woodTheme.colors.line},puzzleCaption:{fontSize:10,lineHeight:16,fontWeight:'700',color:woodTheme.colors.subtle,marginBottom:4},puzzleText:{fontSize:14,lineHeight:22,color:woodTheme.colors.ink},puzzleStrong:{fontSize:15,lineHeight:23,fontWeight:'700',color:woodTheme.colors.ink},puzzleChain:{flexDirection:'row',alignItems:'center',gap:6,flexWrap:'wrap'},puzzleNode:{paddingVertical:9,paddingHorizontal:10,borderWidth:1,borderColor:woodTheme.colors.line,borderRadius:9,backgroundColor:woodTheme.colors.paper},puzzleColumns:{marginTop:16,flexDirection:'row',gap:10},puzzleColumn:{flex:1,padding:10,borderWidth:1,borderColor:woodTheme.colors.line,borderRadius:10,backgroundColor:woodTheme.colors.paper},puzzleGroup:{marginBottom:12},puzzleEdge:{fontSize:12,lineHeight:19,color:woodTheme.colors.muted,marginTop:5},puzzleArrow:{fontSize:16,lineHeight:22,textAlign:'center',color:woodTheme.colors.midWood,marginVertical:4},
  blockTarget:{fontSize:18,lineHeight:26,fontWeight:'800',color:woodTheme.colors.ink,marginBottom:10},tileRow:{flexDirection:'row',flexWrap:'wrap',gap:7},letterTile:{width:32,minHeight:44,borderRadius:8,borderWidth:1,borderColor:woodTheme.colors.line,alignItems:'center',justifyContent:'center',backgroundColor:woodTheme.colors.paper},phraseTile:{minHeight:44,borderRadius:9,borderWidth:1,borderColor:woodTheme.colors.line,paddingHorizontal:12,alignItems:'center',justifyContent:'center',backgroundColor:woodTheme.colors.paper},tileText:{fontSize:14,lineHeight:20,fontWeight:'700',color:woodTheme.colors.ink},contrastChoice:{minHeight:52,borderRadius:10,borderWidth:1,borderColor:woodTheme.colors.line,padding:11,marginBottom:8,backgroundColor:woodTheme.colors.paper},contrastChoiceOn:{borderColor:woodTheme.colors.focus,backgroundColor:woodTheme.colors.focusWash},matchGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},matchItem:{width:'47%',minHeight:48,borderRadius:9,borderWidth:1,borderColor:woodTheme.colors.line,padding:10,justifyContent:'center',backgroundColor:woodTheme.colors.paper},originalLine:{fontSize:16,lineHeight:25,color:woodTheme.colors.ink,paddingBottom:10,borderBottomWidth:1,borderBottomColor:woodTheme.colors.line},segmentRow:{flexDirection:'row',alignItems:'center',gap:10,minHeight:48,borderBottomWidth:1,borderBottomColor:woodTheme.colors.line},segmentLabel:{width:24,height:24,borderRadius:12,textAlign:'center',lineHeight:24,backgroundColor:woodTheme.colors.woodWash,color:woodTheme.colors.midWood,fontWeight:'800'},returnMark:{alignSelf:'center',width:64,borderBottomWidth:2,borderBottomColor:woodTheme.colors.focus,marginVertical:12},
  status:{marginTop:14,padding:12,borderRadius:12,backgroundColor:woodTheme.colors.background,flexDirection:'row',gap:9,alignItems:'flex-start'},statusPositive:{backgroundColor:woodTheme.colors.successWash},statusDot:{width:7,height:7,borderRadius:4,backgroundColor:woodTheme.colors.midWood,marginTop:5},statusDotPositive:{backgroundColor:woodTheme.colors.success},statusText:{flex:1,fontSize:12,lineHeight:18,color:woodTheme.colors.ink},feedback:{marginTop:12,padding:11,borderLeftWidth:3,borderLeftColor:woodTheme.colors.focus,backgroundColor:woodTheme.colors.focusWash,fontSize:13,lineHeight:20,color:woodTheme.colors.deepWood},lookup:{marginTop:14},primary:{minHeight:50,marginTop:14,borderRadius:13,backgroundColor:woodTheme.colors.deepWood,alignItems:'center',justifyContent:'center',paddingHorizontal:14},disabled:{opacity:.35},primaryText:{fontSize:14,fontWeight:'700',color:woodTheme.colors.paper},secondaryRow:{minHeight:44,marginTop:8,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:18,flexWrap:'wrap'},secondary:{minHeight:44,justifyContent:'center'},secondaryText:{fontSize:12,fontWeight:'600',color:woodTheme.colors.subtle}
});
