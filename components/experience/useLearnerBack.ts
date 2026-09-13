import { useEffect, useRef } from 'react';
import { BackHandler, Keyboard, Platform } from 'react-native';

export function useLearnerBack(onExit:()=>void|Promise<void>,onCloseTransient?:()=>boolean,enabled=true){
  const keyboardVisible=useRef(false),exitRef=useRef(onExit),transientRef=useRef(onCloseTransient);
  useEffect(()=>{exitRef.current=onExit;transientRef.current=onCloseTransient},[onExit,onCloseTransient]);
  useEffect(()=>{
    const show=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillShow':'keyboardDidShow',()=>{keyboardVisible.current=true});
    const hide=Keyboard.addListener(Platform.OS==='ios'?'keyboardWillHide':'keyboardDidHide',()=>{keyboardVisible.current=false});
    if(!enabled)return()=>{show.remove();hide.remove()};
    const back=BackHandler.addEventListener('hardwareBackPress',()=>{
      if(transientRef.current?.())return true;
      if(keyboardVisible.current){Keyboard.dismiss();return true}
      void exitRef.current();return true;
    });
    return()=>{show.remove();hide.remove();back.remove()};
  },[enabled]);
}
