import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppDataProvider } from '../context/AppDataContext';
import { AuthProvider } from '../context/AuthContext';
import { theme } from '../lib/theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.text,
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="workout/[id]" options={{ title: 'Workout' }} />
          <Stack.Screen name="organization-demo" options={{ title: 'Organization workspace' }} />
        </Stack>
      </AppDataProvider>
    </AuthProvider>
  );
}
