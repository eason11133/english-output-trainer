import { Href, Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { AppDataProvider, useCanonicalProductData } from '../context/AppDataContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { theme } from '../lib/theme';
import { decideGlobalRouteAccess } from '../src/application/access/learnerAccessPolicy';
import { firstDayResumeRoute } from '../src/experience/firstDayTutorialState';

function Navigator(){
  const {isAuthenticated,loading}=useAuth();
  const {ready,initialContextCompleted,profile}=useCanonicalProductData();
  const segments=useSegments();
  if(!loading&&ready){
    const access=decideGlobalRouteAccess({authenticated:isAuthenticated,onboardingCompleted:initialContextCompleted,segments:segments as readonly string[],dev:__DEV__||process.env.EXPO_PUBLIC_ENABLE_BLOCK_LAB==='true'||process.env.EXPO_PUBLIC_ENABLE_UIUX_HARNESS==='true'});
    if(access==='SIGN_IN')return <Redirect href="/(auth)/sign-in"/>;
    if(access==='ONBOARDING')return <Redirect href={firstDayResumeRoute(profile) as Href}/>;
    if(access==='TODAY')return <Redirect href={'/(tabs)'as Href}/>;
  }
  return <><StatusBar style="dark"/><Stack screenOptions={{headerStyle:{backgroundColor:theme.colors.background},headerTintColor:theme.colors.text,contentStyle:{backgroundColor:theme.colors.background}}}><Stack.Screen name="index" options={{headerShown:false}}/><Stack.Screen name="(auth)" options={{headerShown:false}}/><Stack.Screen name="(tabs)" options={{headerShown:false}}/><Stack.Screen name="onboarding/goals" options={{headerShown:false}}/><Stack.Screen name="onboarding/date" options={{headerShown:false}}/><Stack.Screen name="onboarding/time" options={{headerShown:false}}/><Stack.Screen name="onboarding/signal" options={{headerShown:false}}/><Stack.Screen name="onboarding/exam" options={{headerShown:false}}/><Stack.Screen name="onboarding/handoff" options={{headerShown:false}}/><Stack.Screen name="quick-calibration" options={{headerShown:false}}/><Stack.Screen name="daily-lesson" options={{headerShown:false}}/><Stack.Screen name="exam-practice" options={{headerShown:false}}/><Stack.Screen name="reading-attempt" options={{headerShown:false}}/><Stack.Screen name="result" options={{headerShown:false}}/><Stack.Screen name="profile" options={{headerShown:false}}/><Stack.Screen name="settings" options={{headerShown:false}}/></Stack></>;
}
export default function Root(){return <LocaleProvider><KeyboardProvider><AuthProvider><AppDataProvider><Navigator/></AppDataProvider></AuthProvider></KeyboardProvider></LocaleProvider>}
