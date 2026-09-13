import { Link, router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppButton } from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';
import { theme } from '../../lib/theme';

export default function SignInScreen() {
  const { signIn, demoMode } = useAuth();
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    if (demoMode) {
      router.replace('/');
      return;
    }
    setBusy(true);
    const error = await signIn(email.trim(), password);
    setBusy(false);
    if (error) Alert.alert(t('auth.signInFailed'), error);
    else router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>{t('auth.eyebrow')}</Text>
      <Text style={styles.title}>{t('auth.signInTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.signInSubtitle')}</Text>

      {demoMode ? (
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>{t('auth.demoTitle')}</Text>
          <Text style={styles.demoText}>{t('auth.demoBody')}</Text>
        </View>
      ) : (
        <>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder={t('auth.email')}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            secureTextEntry
            placeholder={t('auth.password')}
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      <AppButton
        label={demoMode ? t('auth.enterDemo') : busy ? t('auth.signingIn') : t('auth.signIn')}
        disabled={busy}
        onPress={handleSignIn}
      />

      {!demoMode && (
        <Text style={styles.footer}>
          {t('auth.newHere')} <Link href="/(auth)/sign-up" style={styles.link}>{t('auth.createAccountLink')}</Link>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 16, backgroundColor: theme.colors.background },
  eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 32, lineHeight: 38, fontWeight: '900' },
  subtitle: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 23, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.surface, paddingHorizontal: 14 },
  demoBox: { borderRadius: 16, padding: 16, backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderWidth: 1 },
  demoTitle: { color: theme.colors.text, fontWeight: '800', marginBottom: 4 },
  demoText: { color: theme.colors.textMuted, lineHeight: 20 },
  footer: { color: theme.colors.textMuted, textAlign: 'center', marginTop: 8 },
  link: { color: theme.colors.primary, fontWeight: '700' },
});
