import React,{useEffect,useRef,useState}from'react';
import{AccessibilityInfo,Animated,Image,Pressable,StyleSheet,Text,View}from'react-native';
import{eotLearnerTokensV1 as t}from'../../src/ui';

export function EOTFirstLaunchIntro({active,onFinished,children}:{active:boolean;onFinished:()=>void|Promise<void>;children:React.ReactNode}){
 const[visible,setVisible]=useState(active),finishing=useRef(false),opacity=useRef(new Animated.Value(active?1:0)).current,mark=useRef(new Animated.Value(.96)).current;
 useEffect(()=>{if(!active)return;let cancelled=false;void AccessibilityInfo.isReduceMotionEnabled().then(reduced=>{if(cancelled)return;if(reduced){mark.setValue(1);return}Animated.spring(mark,{toValue:1,damping:18,stiffness:120,mass:.8,useNativeDriver:true}).start()});const timer=setTimeout(()=>finish(),2300);return()=>{cancelled=true;clearTimeout(timer)}},[active]);
 function finish(reduced=false){if(finishing.current)return;finishing.current=true;const done=()=>{setVisible(false);void onFinished()};if(reduced){opacity.setValue(0);done()}else Animated.timing(opacity,{toValue:0,duration:160,useNativeDriver:true}).start(done)}
 return <View style={s.root}>{children}{active&&visible?<Animated.View style={[StyleSheet.absoluteFill,s.overlay,{opacity}]}><Pressable accessibilityRole="button" accessibilityLabel="跳過開場，進入 EOT" onPress={()=>finish()} style={s.press}><Animated.View style={[s.assetFrame,{transform:[{scale:mark}]}]}><Image accessibilityIgnoresInvertColors source={require('../../assets/images/EOT_founder_approved_app_icon_v1.png')} resizeMode="contain" style={s.asset}/></Animated.View><Text style={s.skip}>點一下直接開始</Text></Pressable></Animated.View>:null}</View>;
}
const s=StyleSheet.create({root:{flex:1},overlay:{backgroundColor:t.colors.background,zIndex:100},press:{flex:1,alignItems:'center',justifyContent:'center',padding:28},assetFrame:{width:'82%',maxWidth:330,aspectRatio:1},asset:{width:'100%',height:'100%'},skip:{position:'absolute',bottom:42,fontSize:13,fontWeight:'800',color:t.colors.subtle}});
