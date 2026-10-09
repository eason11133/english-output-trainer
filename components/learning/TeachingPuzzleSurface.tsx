import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TeachingPuzzleExperienceVMV1 } from '../../src/experience/teachingPuzzleExperience';
import { eotLearnerTokensV1 as t } from '../../src/ui/tokens';

export type TeachingPuzzleUIEventV1=
  |{type:'CONTRAST_SELECTED';instanceId:string;side:'LEFT'|'RIGHT';value:string}
  |{type:'RELATION_ATTEMPTED';instanceId:string;from:string;to:string}
  |{type:'STEP_REVEALED';instanceId:string;index:number;value:string}
  |{type:'TRANSFORMATION_RECONSTRUCTED';instanceId:string;value:string}
  |{type:'CHUNK_PARTNER_SELECTED';instanceId:string;index:number;value:string}
  |{type:'EVIDENCE_SELECTED';instanceId:string;index:number;value:string}
  |{type:'REFORMULATION_SELECTED';instanceId:string;index:number;value:string};

export function TeachingPuzzleSurface({vm,onEvent,onComplete,onStuck}:{vm:TeachingPuzzleExperienceVMV1;onEvent?:(event:TeachingPuzzleUIEventV1)=>void;onComplete?:()=>void;onStuck?:()=>void}){
  const[interacted,setInteracted]=useState(false),emit=(event:TeachingPuzzleUIEventV1)=>{if(event.type!=='STEP_REVEALED')setInteracted(true);onEvent?.(event)};
  return <View style={s.root} testID={`teaching-puzzle-${vm.puzzleId}`}>
    <Text style={s.instruction}>{vm.instruction}</Text>
    {vm.kind==='CONTRAST'?<ContrastPuzzle vm={vm} onEvent={emit}/>:null}
    {vm.kind==='RELATION_MAP'?<RelationPuzzle vm={vm} onEvent={emit}/>:null}
    {vm.kind==='WORKED_TRANSFORMATION'?<TransformationPuzzle vm={vm} onEvent={emit}/>:null}
    {vm.kind==='CHUNK_BUILD'?<ChunkPuzzle vm={vm} onEvent={emit}/>:null}
    {vm.kind==='EVIDENCE_BRIDGE'?<EvidencePuzzle vm={vm} onEvent={emit}/>:null}
    {vm.kind==='REFORMULATION'?<ReformulationPuzzle vm={vm} onEvent={emit}/>:null}
    <View style={s.actions}>
      {onComplete?<Pressable accessibilityRole="button" disabled={!interacted} onPress={onComplete} style={[s.primaryAction,!interacted&&s.disabledAction]}><Text style={s.primaryActionText}>換我試</Text></Pressable>:null}
      {onStuck?<Pressable accessibilityRole="button" onPress={onStuck} style={s.secondaryAction}><Text style={s.secondaryActionText}>還是不懂</Text></Pressable>:null}
    </View>
  </View>;
}

function ContrastPuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'CONTRAST'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[selected,setSelected]=useState<'LEFT'|'RIGHT'>();
  const choose=(side:'LEFT'|'RIGHT',value:string)=>{setSelected(side);onEvent?.({type:'CONTRAST_SELECTED',instanceId:vm.instanceId,side,value})};
  return <View>
    {vm.context?<Text style={s.context}>{vm.context}</Text>:null}
    <View style={s.columns}>
      <Pressable accessibilityRole="button" accessibilityState={{selected:selected==='LEFT'}} onPress={()=>choose('LEFT',vm.left)} style={[s.column,selected==='LEFT'&&s.selected]}>
        <Text style={s.columnText}>{vm.left}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{selected:selected==='RIGHT'}} onPress={()=>choose('RIGHT',vm.right)} style={[s.column,selected==='RIGHT'&&s.selected]}>
        <Text style={s.columnText}>{vm.right}</Text>
      </Pressable>
    </View>
    {vm.criterion?<Text style={s.note}>{vm.criterion}</Text>:null}
  </View>;
}

function RelationPuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'RELATION_MAP'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[first,setFirst]=useState<string>();
  const tap=(id:string)=>{
    if(!first){setFirst(id);return}
    if(first===id){setFirst(undefined);return}
    onEvent?.({type:'RELATION_ATTEMPTED',instanceId:vm.instanceId,from:first,to:id});
    setFirst(undefined);
  };
  return <View>
    {vm.learnerOutput?<Text style={s.learnerOutput}>{vm.learnerOutput}</Text>:null}
    <View style={s.nodeWrap}>{vm.nodes.map(node=><Pressable key={node.id} accessibilityRole="button" accessibilityState={{selected:first===node.id}} onPress={()=>tap(node.id)} style={[s.node,first===node.id&&s.selected]}><Text style={s.nodeText}>{node.label}</Text></Pressable>)}</View>
    <Text style={s.microcopy}>{first?'再點一個單位，把兩者連起來。':'先點一個單位。'}</Text>
    <View style={s.edgeList}>{vm.edges.map((edge,index)=><Text key={`${edge.from}-${edge.to}-${index}`} style={s.edge}>{edge.from} → {edge.to}{edge.label?` · ${edge.label}`:''}</Text>)}</View>
  </View>;
}

function TransformationPuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'WORKED_TRANSFORMATION'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[revealed,setRevealed]=useState(1),[reconstruction,setReconstruction]=useState('');
  const next=()=>{
    if(revealed>=vm.steps.length)return;
    const index=revealed;
    setRevealed(value=>Math.min(vm.steps.length,value+1));
    onEvent?.({type:'STEP_REVEALED',instanceId:vm.instanceId,index,value:vm.steps[index]});
  };
  const submit=()=>{const value=reconstruction.trim();if(value)onEvent?.({type:'TRANSFORMATION_RECONSTRUCTED',instanceId:vm.instanceId,value})};
  return <View>
    <Text style={s.learnerOutput}>{vm.learnerOutput}</Text>
    <View style={s.sequence}>{vm.steps.slice(0,revealed).map((step,index)=><View key={`${index}-${step}`} style={s.step}><Text style={s.stepIndex}>{index+1}</Text><Text style={s.stepText}>{step}</Text></View>)}</View>
    {revealed<vm.steps.length?<Pressable accessibilityRole="button" onPress={next} style={s.secondaryAction}><Text style={s.secondaryActionText}>看下一個變化</Text></Pressable>:<View style={s.reconstruct}><Text style={s.smallLabel}>現在換你重建</Text><TextInput accessibilityLabel="自己重建一次" value={reconstruction} onChangeText={setReconstruction} onSubmitEditing={submit} placeholder="不照抄步驟，自己寫一次" style={s.reconstructInput}/><Pressable accessibilityRole="button" disabled={!reconstruction.trim()} onPress={submit} style={[s.secondaryAction,!reconstruction.trim()&&s.disabledAction]}><Text style={s.secondaryActionText}>完成重建</Text></Pressable></View>}
  </View>;
}

function ChunkPuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'CHUNK_BUILD'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[selected,setSelected]=useState<number>();
  return <View>
    {vm.context?<Text style={s.context}>{vm.context}</Text>:null}
    <Text style={s.focusText}>{vm.targetLanguage}</Text>
    <View style={s.nodeWrap}>{vm.partners.map((partner,index)=><Pressable key={`${partner}-${index}`} accessibilityRole="button" accessibilityState={{selected:selected===index}} onPress={()=>{setSelected(index);onEvent?.({type:'CHUNK_PARTNER_SELECTED',instanceId:vm.instanceId,index,value:partner})}} style={[s.node,selected===index&&s.selected]}><Text style={s.nodeText}>{partner}</Text></Pressable>)}</View>
    {vm.examples.length?<View style={s.examples}>{vm.examples.map((example,index)=><Text key={`${example}-${index}`} style={s.example}>{example}</Text>)}</View>:null}
  </View>;
}

function EvidencePuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'EVIDENCE_BRIDGE'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[selected,setSelected]=useState<number>();
  return <View>
    <Text style={s.context}>{vm.prompt}</Text>
    <Text style={s.sourceText}>{vm.sourceText}</Text>
    <Text style={s.smallLabel}>哪一段最能支撐你的判斷？</Text>
    <View style={s.evidenceList}>{vm.evidenceSpans.map((span,index)=><Pressable key={`${span}-${index}`} accessibilityRole="button" accessibilityState={{selected:selected===index}} onPress={()=>{setSelected(index);onEvent?.({type:'EVIDENCE_SELECTED',instanceId:vm.instanceId,index,value:span})}} style={[s.evidence,selected===index&&s.selected]}><Text style={s.evidenceText}>{span}</Text></Pressable>)}</View>
  </View>;
}

function ReformulationPuzzle({vm,onEvent}:{vm:Extract<TeachingPuzzleExperienceVMV1,{kind:'REFORMULATION'}>;onEvent?:(event:TeachingPuzzleUIEventV1)=>void}){
  const[selected,setSelected]=useState<number>();
  return <View>
    <Text style={s.smallLabel}>原意</Text>
    <Text style={s.meaning}>{vm.meaning}</Text>
    {vm.learnerOutput?<><Text style={s.smallLabel}>你的版本</Text><Text style={s.learnerOutput}>{vm.learnerOutput}</Text></>:null}
    <View style={s.altList}>{vm.alternatives.map((item,index)=><Pressable key={`${item}-${index}`} accessibilityRole="button" accessibilityState={{selected:selected===index}} onPress={()=>{setSelected(index);onEvent?.({type:'REFORMULATION_SELECTED',instanceId:vm.instanceId,index,value:item})}} style={[s.alt,selected===index&&s.selected]}><Text style={s.altText}>{item}</Text></Pressable>)}</View>
  </View>;
}

const s=StyleSheet.create({
  root:{marginTop:t.spacing.lg},
  instruction:{fontSize:t.typography.body,lineHeight:t.lineHeight.body,color:t.colors.ink,fontWeight:'600',marginBottom:t.spacing.md},
  context:{fontSize:t.typography.secondary,lineHeight:t.lineHeight.secondary,color:t.colors.muted,marginBottom:t.spacing.sm},
  columns:{flexDirection:'row',gap:t.spacing.sm},
  column:{flex:1,minHeight:88,borderWidth:1,borderColor:t.colors.line,borderRadius:t.radius.medium,padding:t.spacing.md,justifyContent:'center',backgroundColor:t.colors.paper},
  selected:{borderColor:t.colors.focus,backgroundColor:t.colors.focusWash},
  columnText:{fontSize:t.typography.body,lineHeight:t.lineHeight.body,color:t.colors.ink},
  note:{fontSize:t.typography.caption,lineHeight:t.lineHeight.metadata,color:t.colors.subtle,marginTop:t.spacing.sm},
  learnerOutput:{fontSize:t.typography.bodyLarge,lineHeight:t.lineHeight.english,color:t.colors.ink,paddingBottom:t.spacing.sm,borderBottomWidth:1,borderBottomColor:t.colors.line,marginBottom:t.spacing.md},
  nodeWrap:{flexDirection:'row',flexWrap:'wrap',gap:t.spacing.sm},
  node:{minHeight:t.layout.minimumTouchTarget,borderWidth:1,borderColor:t.colors.line,borderRadius:t.radius.medium,paddingHorizontal:t.spacing.md,justifyContent:'center',backgroundColor:t.colors.paper},
  nodeText:{fontSize:t.typography.secondary,lineHeight:t.lineHeight.secondary,color:t.colors.ink,fontWeight:'600'},
  microcopy:{fontSize:t.typography.caption,lineHeight:t.lineHeight.metadata,color:t.colors.subtle,marginTop:t.spacing.sm},
  edgeList:{marginTop:t.spacing.md,gap:t.spacing.xs},
  edge:{fontSize:t.typography.caption,lineHeight:t.lineHeight.metadata,color:t.colors.muted},
  sequence:{gap:t.spacing.sm},
  step:{flexDirection:'row',alignItems:'flex-start',gap:t.spacing.sm,paddingVertical:t.spacing.sm,borderBottomWidth:1,borderBottomColor:t.colors.line},
  stepIndex:{width:24,height:24,borderRadius:12,textAlign:'center',lineHeight:24,backgroundColor:t.colors.woodWash,color:t.colors.midWood,fontWeight:'800'},
  stepText:{flex:1,fontSize:t.typography.body,lineHeight:t.lineHeight.body,color:t.colors.ink},
  reconstruct:{marginTop:t.spacing.md},reconstructInput:{minHeight:54,borderWidth:1,borderColor:t.colors.line,borderRadius:t.radius.medium,paddingHorizontal:t.spacing.md,paddingVertical:t.spacing.sm,fontSize:t.typography.body,color:t.colors.ink,backgroundColor:t.colors.paper},
  secondaryAction:{minHeight:t.layout.minimumTouchTarget,alignSelf:'flex-start',justifyContent:'center',marginTop:t.spacing.sm},
  secondaryActionText:{fontSize:t.typography.secondary,color:t.colors.midWood,fontWeight:'700'},
  focusText:{fontSize:t.typography.section,lineHeight:t.lineHeight.section,color:t.colors.ink,fontWeight:'800',marginBottom:t.spacing.md},
  examples:{marginTop:t.spacing.md,gap:t.spacing.xs},
  example:{fontSize:t.typography.secondary,lineHeight:t.lineHeight.secondary,color:t.colors.muted},
  sourceText:{fontSize:t.typography.bodyLarge,lineHeight:t.lineHeight.english,color:t.colors.ink,marginBottom:t.spacing.md},
  smallLabel:{fontSize:t.typography.caption,lineHeight:t.lineHeight.metadata,color:t.colors.subtle,marginBottom:t.spacing.xs,marginTop:t.spacing.sm},
  evidenceList:{gap:t.spacing.sm},
  evidence:{minHeight:t.layout.minimumTouchTarget,borderLeftWidth:3,borderLeftColor:t.colors.line,paddingVertical:t.spacing.sm,paddingHorizontal:t.spacing.md,backgroundColor:t.colors.paper},
  evidenceText:{fontSize:t.typography.secondary,lineHeight:t.lineHeight.secondary,color:t.colors.ink},
  meaning:{fontSize:t.typography.bodyLarge,lineHeight:t.lineHeight.english,color:t.colors.ink,marginBottom:t.spacing.md},
  altList:{gap:t.spacing.sm},
  alt:{minHeight:t.layout.minimumTouchTarget,borderWidth:1,borderColor:t.colors.line,borderRadius:t.radius.medium,padding:t.spacing.md,justifyContent:'center',backgroundColor:t.colors.paper},
  altText:{fontSize:t.typography.body,lineHeight:t.lineHeight.body,color:t.colors.ink},
  actions:{marginTop:t.spacing.lg,gap:t.spacing.xs},primaryAction:{minHeight:50,borderRadius:t.radius.action,backgroundColor:t.colors.deepWood,alignItems:'center',justifyContent:'center',paddingHorizontal:t.spacing.md},disabledAction:{opacity:.35},primaryActionText:{fontSize:t.typography.secondary,fontWeight:'700',color:t.colors.paper},
});
