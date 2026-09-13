import Ionicons from '@expo/vector-icons/Ionicons';
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
      <Tabs.Screen name="index" options={{ title: 'Today', headerTitle: 'English Output Trainer', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="errors" options={{ title: 'Error Bank', headerTitle: 'Personal Error Bank', tabBarIcon: ({ color, size }) => <Ionicons name="bug-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="progress" options={{ title: 'Progress', headerTitle: 'Progress', tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
