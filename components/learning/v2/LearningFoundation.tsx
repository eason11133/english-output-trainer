import React,{useEffect,useRef,useState}from'react';
import{Animated,Pressable,StyleProp,StyleSheet,Text,TextInput,TextStyle,View,ViewStyle}from'react-native';
import{eotLearnerTokensV1 as t}from'../../../src/ui/tokens';

export type LanguageObjectKind='word'|'chunk'|'sentence'|'evidence'|'clause';
export type LanguageObjectState='idle'|'pressed'|'focused'|'selected'|'wrong'|'corrected'|'dimmed'|'dragging';

export function LearningCanvas({children,dimmed=false,style}:{children:React.ReactNode;dimmed?:boolean;style?:StyleProp<ViewStyle>}){
 return <View style={[s.canvas,dimmed&&s.canvasDimmed,style]}>{children}</View>;
}

export function LanguageObject({children,kind='word',state='idle',onPress,style}:{children:React.ReactNode;kind?:LanguageObjectKind;state?:LanguageObjectState;onPress?:()=>void;style?:StyleProp<TextStyle>}){
 const object=<Text style={[s.language,state!=='idle'&&s[state],kind==='evidence'&&s.evidence,style]}>{children}</Text>;
 return onPress?<Pressable onPress={onPress} style={({pressed})=>pressed&&s.pressWrap}>{object}</Pressable>:object;
}

export function InlineSlot({value,active=false,wrong=false,onPress}:{value?:string;active?:boolean;wrong?:boolean;onPress?:()=>void}){
 return <Text accessibilityRole="button" onPress={onPress} style={[s.inlineSlot,active&&s.slotActive,wrong&&s.slotWrong]}>{value||'　　　'}</Text>;
}

export function FocusedRange({value,target,prompt,onChange,multiline=false,accessibilityLabel='可直接修改的原作'}:{value:string;target?:string;prompt?:string;onChange:(value:string)=>void;multiline?:boolean;accessibilityLabel?:string}){
 const input=useRef<TextInput>(null),start=target&&value.includes(target)?value.indexOf(target):value.length;
 const[selection,setSelection]=useState({start,end:start+(target&&value.includes(target)?target.length:0)});
 useEffect(()=>{if(!target||!value.includes(target))return;const next=value.indexOf(target),timer=setTimeout(()=>{setSelection({start:next,end:next+target.length});input.current?.focus()},60);return()=>clearTimeout(timer)},[target,value]);
 return <View style={s.authoredArea}>
  {prompt&&target?<ContextualMicroPrompt text={prompt}/>:null}
  <TextInput ref={input} value={value} multiline={multiline} accessibilityLabel={accessibilityLabel} selection={selection} selectionColor={t.colors.focus} onSelectionChange={event=>setSelection(event.nativeEvent.selection)} onChangeText={onChange} style={[s.authoredInput,multiline&&s.authoredLong]}/>
 </View>;
}

export function ContextualMicroPrompt({text}:{text:string}){return <View style={s.micro}><View style={s.microStem}/><Text style={s.microText}>{text}</Text></View>}

export function DragLift({children,dragging,onPress}:{children:React.ReactNode;dragging:boolean;onPress?:()=>void}){
 const[lift]=useState(()=>new Animated.Value(0));useEffect(()=>{Animated.spring(lift,{toValue:dragging?1:0,useNativeDriver:true,speed:24,bounciness:5}).start()},[dragging,lift]);
 return <Animated.View style={{transform:[{translateY:lift.interpolate({inputRange:[0,1],outputRange:[0,-6]})},{scale:lift.interpolate({inputRange:[0,1],outputRange:[1,1.035]})}],zIndex:dragging?20:1}}><Pressable onPress={onPress} style={[s.dragObject,dragging&&s.dragLift]}>{children}</Pressable></Animated.View>;
}

export function InsertionBoundary({active,preview,children}:{active:boolean;preview?:string;children?:React.ReactNode}){
 return <View style={[s.boundary,active&&s.boundaryActive,preview&&s.boundaryPreview]}>{preview?<Text style={s.inserted}>{preview}</Text>:children}</View>;
}

export function AnchoredClaim({children}:{children:React.ReactNode}){return <View style={s.claim}><Text style={s.claimMark}>×</Text><Text style={s.claimText}>{children}</Text><View style={s.claimAnchor}/></View>}
export function EvidenceSpan({children,selected,onPress}:{children:React.ReactNode;selected:boolean;onPress:()=>void}){return <Pressable onPress={onPress} style={[s.evidenceSpan,selected&&s.evidenceSelected]}><Text style={s.evidenceText}>{children}</Text></Pressable>}

const s=StyleSheet.create({canvas:{backgroundColor:t.colors.canvas,gap:16},canvasDimmed:{opacity:.42},language:{fontSize:18,lineHeight:31,color:t.colors.ink},pressWrap:{opacity:.78},idle:{},pressed:{opacity:.72},focused:{color:t.colors.deepWood,borderBottomWidth:3,borderBottomColor:t.colors.focus},selected:{backgroundColor:t.colors.amberSoft},wrong:{color:t.colors.danger,textDecorationLine:'line-through'},corrected:{color:t.colors.success,borderBottomWidth:2,borderBottomColor:t.colors.success},dimmed:{opacity:.38},dragging:{color:t.colors.deepWood},evidence:{textDecorationLine:'underline',textDecorationColor:t.colors.focus},inlineSlot:{color:t.colors.deepWood,borderBottomWidth:2,borderBottomColor:t.colors.focus,backgroundColor:t.colors.focusWash,fontWeight:'700'},slotActive:{backgroundColor:t.colors.amberSoft,borderBottomWidth:3},slotWrong:{color:t.colors.danger,borderBottomColor:t.colors.danger},authoredArea:{position:'relative',paddingTop:38},authoredInput:{minHeight:92,paddingHorizontal:0,paddingVertical:12,fontSize:20,lineHeight:34,color:t.colors.ink,borderBottomWidth:1,borderBottomColor:t.colors.dividerStrong,backgroundColor:'transparent',outlineStyle:'none' as never},authoredLong:{minHeight:270,textAlignVertical:'top'},micro:{position:'absolute',top:0,left:12,zIndex:3,flexDirection:'row',alignItems:'center',gap:7},microStem:{width:18,height:1,backgroundColor:t.colors.focus},microText:{fontSize:13,lineHeight:19,color:t.colors.deepWood,backgroundColor:t.colors.focusWash,paddingHorizontal:10,paddingVertical:5,borderRadius:8},dragObject:{minHeight:42,justifyContent:'center',paddingHorizontal:12,borderWidth:1,borderColor:t.colors.dividerStrong,borderRadius:12,backgroundColor:t.colors.paper},dragLift:{shadowColor:t.colors.shadow,shadowOpacity:.2,shadowRadius:10,elevation:6,borderColor:t.colors.focus,backgroundColor:t.colors.focusWash},boundary:{minHeight:2,marginVertical:1,borderRadius:8},boundaryActive:{minHeight:36,marginVertical:5,borderWidth:1,borderStyle:'dashed',borderColor:t.colors.focus,backgroundColor:t.colors.focusWash},boundaryPreview:{minHeight:50,borderStyle:'solid',padding:8},inserted:{fontSize:18,lineHeight:30,color:t.colors.deepWood},claim:{position:'relative',flexDirection:'row',gap:9,paddingHorizontal:12,paddingVertical:10,marginBottom:8,borderLeftWidth:3,borderLeftColor:t.colors.danger,backgroundColor:t.colors.dangerWash,borderRadius:8},claimMark:{fontSize:17,fontWeight:'800',color:t.colors.danger},claimText:{flex:1,fontSize:15,lineHeight:23,color:t.colors.ink},claimAnchor:{position:'absolute',left:20,bottom:-14,width:2,height:14,backgroundColor:t.colors.focus},evidenceSpan:{paddingVertical:9,paddingHorizontal:9,borderLeftWidth:3,borderLeftColor:'transparent',borderRadius:6},evidenceSelected:{backgroundColor:t.colors.focusWash,borderLeftColor:t.colors.focus},evidenceText:{fontSize:18,lineHeight:30,color:t.colors.ink}});
