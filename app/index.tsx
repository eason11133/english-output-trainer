import { Href, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCanonicalProductData } from '../context/AppDataContext';
import { theme } from '../lib/theme';
import { decideLearnerAccess } from '../src/application/access/learnerAccessPolicy';
import { firstDayResumeRoute } from '../src/experience/firstDayTutorialState';

export default function Index() {
  const { loading, isAuthenticated } = useAuth();
  const { ready, practiceGoals, profile } = useCanonicalProductData();

  if (loading || !ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const decision = decideLearnerAccess({ authenticated: isAuthenticated, onboardingCompleted: practiceGoals.onboardingCompleted });
  if (decision === 'SIGN_IN') return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href={firstDayResumeRoute(profile) as Href} />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background },
});
