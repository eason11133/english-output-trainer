import { en } from './en';
import { zhTW } from './zh-TW';

export type AppLocale = 'zh-TW' | 'en';
export type LanguagePreference = 'system' | AppLocale;
export type TranslationKey = keyof typeof en | `lesson.hint${number}`;
export type TranslationParams = Record<string, string | number>;

export const translations = { en, 'zh-TW': zhTW } as const;

export function translate(locale: AppLocale, key: TranslationKey, params?: TranslationParams): string {
  const knownKey = key as keyof typeof en;
  const template = translations[locale][knownKey] ?? en[knownKey];
  if (!params) return template;
  return Object.entries(params).reduce(
    (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
