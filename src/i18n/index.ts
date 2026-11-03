// App strings in the device's language. There's deliberately no in-app picker:
// the language follows Android's system setting (or, on Android 13+, the
// per-app language under Settings → Apps → Culpeos → Language).
//
// The language is read once at startup. Android recreates the activity when
// the locale changes but keeps the JS context, so a change made while the app
// is running applies the next time it's launched.

import {I18nManager} from 'react-native';
import {en, type Strings} from './en';
import {es} from './es';
import {pt} from './pt';

export type {Strings};
export type Language = 'en' | 'es' | 'pt';

const STRINGS: Record<Language, Strings> = {en, es, pt};

// `es_MX`, `pt-BR`, `es` -> a supported language; anything else -> English.
export function languageFor(
  localeIdentifier: string | null | undefined,
): Language {
  const language = localeIdentifier?.split(/[-_]/)[0]?.toLowerCase();
  return language === 'es' || language === 'pt' ? language : 'en';
}

export function stringsFor(language: Language): Strings {
  return STRINGS[language];
}

export const language: Language = languageFor(
  I18nManager.getConstants?.().localeIdentifier,
);

export const t: Strings = stringsFor(language);
