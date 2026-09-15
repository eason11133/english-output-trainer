import { Href, Redirect, router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCanonicalProductData } from '../context/AppDataContext';
import { theme } from '../lib/theme';
import { decideLearnerAccess } from '../src/application/access/learnerAccessPolicy';
import { firstDayResumeRoute } from '../src/experience/firstDayTutorialState';
import { EOTFirstLaunchIntro } from '../components/experience/EOTFirstLaunchIntro';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();
  const { ready, practiceGoals, profile, recordTutorialAction } = useCanonicalProductData();
  const [openingComplete,setOpeningComplete]=useState(false);
  const finishing=useRef(false);

  if (loading || !ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const decision = decideLearnerAccess({ authenticated: isAuthenticated, onboardingCompleted: practiceGoals.onboardingCompleted });
  if (decision === 'SIGN_IN') return <Redirect href="/(auth)/sign-in" />;
  const destination=firstDayResumeRoute(profile) as Href;
  if(openingComplete)return <Redirect href={destination}/>;
  const fresh=profile.onboarding.status!=='COMPLETED'&&!profile.onboarding.firstDay?.milestones.OPENING_COMPLETED;
  return <EOTFirstLaunchIntro active onFinished={async()=>{if(finishing.current)return;finishing.current=true;if(fresh)await recordTutorialAction('OPENING_COMPLETED','production-opening-finished','/');setOpeningComplete(true);router.replace(destination)}} duration={fresh?2300:900}><View style={styles.center}/></EOTFirstLaunchIntro>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
});
