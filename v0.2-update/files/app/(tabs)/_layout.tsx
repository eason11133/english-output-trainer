import { Tabs } from 'expo-router';
import { theme } from '../../lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.text,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today', headerTitle: 'English Output Trainer' }} />
      <Tabs.Screen name="errors" options={{ title: 'Error Bank', headerTitle: 'Personal Error Bank' }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', headerTitle: 'Progress' }} />
    </Tabs>
  );
}
