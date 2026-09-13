import Ionicons from '@expo/vector-icons/Ionicons';
import { Href, Redirect, Tabs } from 'expo-router';
import React from 'react';
import { useCanonicalProductData } from '../../context/AppDataContext';
import { eotLearnerTokensV1 as t } from '../../src/ui';

export default function Layout(){
  const {ready,initialContextCompleted}=useCanonicalProductData();
  if(!ready)return null;
  if(!initialContextCompleted)return <Redirect href={'/onboarding/goals' as Href}/>;
  return <Tabs screenOptions={{
    headerShown:false,
    tabBarActiveTintColor:t.colors.deepWood,
    tabBarInactiveTintColor:t.colors.muted,
    tabBarStyle:{height:64,paddingTop:7,paddingBottom:8,backgroundColor:t.colors.paper,borderTopColor:t.colors.line}
  }}>
    <Tabs.Screen name="index" options={{title:'今天',tabBarIcon:({color})=><Ionicons name="create-outline" size={21} color={color}/>}}/>
    <Tabs.Screen name="practice" options={{title:'練習',tabBarIcon:({color})=><Ionicons name="barbell-outline" size={21} color={color}/>}}/>
    <Tabs.Screen name="my-english" options={{title:'我的英文',tabBarIcon:({color})=><Ionicons name="language-outline" size={21} color={color}/>}}/>
  </Tabs>;
}
