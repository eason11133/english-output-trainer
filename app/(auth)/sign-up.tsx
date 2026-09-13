import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { theme } from '../../lib/theme';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignUp() {
    if (password.length < 8) {
      Alert.alert(t('auth.passwordTooShort'), t('auth.passwordTooShortBody'));
      return;
    }
    setBusy(true);
    const error = await signUp(email.trim(), password);
    setBusy(false);
    if (error) Alert.alert(t('auth.signUpFailed'), error);
    else {
      Alert.alert(t('auth.accountCreated'), t('auth.accountCreatedBody'));
      router.replace('/(auth)/sign-in');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('auth.createAccount')}</Text>
      <Text style={styles.subtitle}>{t('auth.signUpSubtitle')}</Text>
      <TextInput autoCapitalize="none" keyboardType="email-address" placeholder={t('auth.email')} placeholderTextColor={theme.colors.textMuted} style={styles.input} value={email} onChangeText={setEmail} />
      <TextInput secureTextEntry placeholder={t('auth.passwordHint')} placeholderTextColor={theme.colors.textMuted} style={styles.input} value={password} onChangeText={setPassword} />
      <AppButton label={busy ? t('auth.creating') : t('auth.createAccount')} disabled={busy} onPress={handleSignUp} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: theme.colors.background },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 16, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface, paddingHorizontal: 14 },
});
