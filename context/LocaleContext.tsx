import AsyncStorage from '@react-native-async-storage/async-storage';
import { Locale, useLocales } from 'expo-localization';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  AppLocale,
  LanguagePreference,
  translate,
  TranslationKey,
  TranslationParams,
} from '../i18n';

const LANGUAGE_PREFERENCE_KEY = 'eot.languagePreference.v1';

function getSystemLocale(locale: Locale | undefined): AppLocale {
  const languageCode = locale?.languageCode?.toLowerCase();
  return languageCode === 'en' ? 'en' : 'zh-TW';
}

function isLanguagePreference(value: string | null): value is LanguagePreference {
  return value === 'system' || value === 'zh-TW' || value === 'en';
}

type LocaleContextValue = {
  locale: AppLocale;
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey, params?: TranslationParams) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locales = useLocales();
  const systemLocale = getSystemLocale(locales[0]);
  const [preference, setPreferenceState] = useState<LanguagePreference>('system');

  React.useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_PREFERENCE_KEY).then((stored) => {
      if (isLanguagePreference(stored)) setPreferenceState(stored);
    });
  }, []);

  const locale = preference === 'system' ? systemLocale : preference;

  const setPreference = useCallback(async (nextPreference: LanguagePreference) => {
    setPreferenceState(nextPreference);
    await AsyncStorage.setItem(LANGUAGE_PREFERENCE_KEY, nextPreference);
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, preference, setPreference, t }),
    [locale, preference, setPreference, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used inside LocaleProvider');
  return context;
}
