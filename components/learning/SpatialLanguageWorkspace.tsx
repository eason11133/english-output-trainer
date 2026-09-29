import React,{useMemo,useRef,useState}from'react';
import{Animated,PanResponder,Pressable,StyleSheet,Text,View}from'react-native';
import{eotLearnerTokensV1 as t}from'../../src/ui/tokens';
import{UniversalLookupText}from'./UniversalLookupText';

export type SpatialChoice={id:string;text:string};
type TargetRef=View|null;
type Props={kind:'CONTEXTUAL_FILL'|'DISCOURSE';passage:string;blankIds:string[];choices:SpatialChoice[];answers:Record<string,string>;onPlace:(blankId:string,choiceId:string)=>void;onRemove:(blankId:string)=>void;onLookupUsed?:(result:{senseId?:string;lemma?:string})=>void};
const marker=(id:string)=>new RegExp(`(___${id}___|_{2,}\\s*${id}?|\\(${id}\\)\\s*_{2,}|\\[${id}\\])`,'i');

export function SpatialLanguageWorkspace({kind,passage,blankIds,choices,answers,onPlace,onRemove,onLookupUsed}:Props){
 const targets=useRef(new Map<string,TargetRef>()),placed=new Set(Object.values(answers));
 const sections=useMemo(()=>splitPassage(passage,blankIds),[passage,blankIds]);
 return <View style={s.workspace}>
  <Text style={s.instruction}>{kind==='CONTEXTUAL_FILL'?'把詞放進文章真正的空格。放錯位置也可以直接拖走。':'把句子放進文章的銜接位置，讀完整段再決定。'}</Text>
  <View style={s.paper}>{sections.map((section,index)=>section.blankId?<DropLine key={`${section.blankId}-${index}`} id={section.blankId} choice={choices.find(x=>x.id===answers[section.blankId!])} register={node=>targets.current.set(section.blankId!,node)} targets={targets} onPlace={onPlace} onRemove={onRemove}/>:<UniversalLookupText key={`text-${index}`} text={section.text} sourceFamily={kind} lookupGesture="LONG_PRESS" onLookupUsed={onLookupUsed} style={kind==='DISCOURSE'?s.paragraph:s.prose}/>)}</View>
  <View style={s.pool}>{choices.filter(choice=>!placed.has(choice.id)).map(choice=><DragChoice key={choice.id} choice={choice} targets={targets} onPlace={onPlace} onRemove={onRemove}/>)}</View>
 </View>
}

function splitPassage(passage:string,blankIds:string[]){
 let parts:{text:string;blankId?:string}[]=[{text:passage}];
 for(const id of blankIds){const next:typeof parts=[];for(const part of parts){if(part.blankId){next.push(part);continue}const hit=marker(id).exec(part.text);if(!hit){next.push(part);continue}next.push({text:part.text.slice(0,hit.index)},{text:'',blankId:id},{text:part.text.slice(hit.index+hit[0].length)});}parts=next;}
 if(parts.every(part=>!part.blankId)){const paragraphs=passage.split(/\n\s*\n|\n/).filter(Boolean);return paragraphs.flatMap((text,index)=>index<blankIds.length?[{text},{text:'',blankId:blankIds[index]}]:[{text}]);}
 return parts.filter(part=>part.blankId||part.text.trim());
}
function DropLine({id,choice,register,targets,onPlace,onRemove}:{id:string;choice?:SpatialChoice;register:(node:TargetRef)=>void;targets:React.MutableRefObject<Map<string,TargetRef>>;onPlace:(id:string,value:string)=>void;onRemove:(id:string)=>void}){return <View ref={register} accessibilityLabel={`文章第 ${id} 空`} style={[s.drop,choice&&s.dropFilled]}><Text style={s.number}>{id}</Text>{choice?<DragChoice choice={choice} origin={id} targets={targets} onPlace={onPlace} onRemove={onRemove}/>:<Text style={s.hint}>拖到這裡</Text>}</View>}
function locate(targets:Map<string,TargetRef>,x:number,y:number,done:(id?:string)=>void){const entries=[...targets];if(!entries.length){done();return}let left=entries.length,hit:string|undefined;for(const[id,node]of entries){if(!node){if(!--left)done(hit);continue}node.measureInWindow((px,py,width,height)=>{if(x>=px&&x<=px+width&&y>=py&&y<=py+height)hit=id;if(!--left)done(hit)})}}
function DragChoice({choice,origin,targets,onPlace,onRemove}:{choice:SpatialChoice;origin?:string;targets:React.MutableRefObject<Map<string,TargetRef>>;onPlace:(id:string,value:string)=>void;onRemove:(id:string)=>void}){const[position]=useState(()=>new Animated.ValueXY());const responder=useMemo(()=>PanResponder.create({onStartShouldSetPanResponder:()=>true,onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)+Math.abs(g.dy)>3,onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),onPanResponderRelease:(_,g)=>locate(targets.current,g.moveX,g.moveY,id=>{if(id){if(origin&&origin!==id)onRemove(origin);onPlace(id,choice.id)}else if(origin)onRemove(origin);Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:true}).start()}),onPanResponderTerminate:()=>Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:true}).start()}),[choice.id,onPlace,onRemove,origin,position,targets]);return <Animated.View {...responder.panHandlers} accessibilityRole="button" accessibilityLabel={`拖曳 ${choice.text}`} style={[s.token,{transform:position.getTranslateTransform()}]}><Pressable onPress={()=>{if(origin)onRemove(origin)}}><Text style={s.tokenText}>{choice.text}</Text></Pressable></Animated.View>}
const s=StyleSheet.create({workspace:{gap:18},instruction:{fontSize:14,lineHeight:21,color:t.colors.muted},paper:{gap:12,paddingVertical:4},prose:{fontSize:17,lineHeight:31,color:t.colors.ink},paragraph:{fontSize:17,lineHeight:30,color:t.colors.ink,paddingBottom:8},drop:{minHeight:52,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderStyle:'dashed',borderColor:t.colors.dividerStrong,borderRadius:10,paddingHorizontal:10,backgroundColor:t.colors.surface},dropFilled:{borderStyle:'solid',borderColor:t.colors.focus,backgroundColor:t.colors.focusWash},number:{width:20,fontSize:12,color:t.colors.subtle},hint:{fontSize:14,color:t.colors.subtle},pool:{flexDirection:'row',flexWrap:'wrap',gap:9,paddingTop:12,borderTopWidth:1,borderTopColor:t.colors.divider},token:{minHeight:44,maxWidth:'100%',justifyContent:'center',paddingHorizontal:12,borderWidth:1,borderColor:t.colors.dividerStrong,borderRadius:10,backgroundColor:t.colors.paper,zIndex:10},tokenText:{fontSize:15,lineHeight:22,color:t.colors.ink}});
