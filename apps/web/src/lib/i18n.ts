import { createI18n, type Locale } from '@pastortools/i18n';

const STORAGE_KEY = 'pastortools.locale';

/**
 * El idioma inicial es el del navegador (es decir, el del dispositivo).
 * Si el usuario elige otro manualmente, esa preferencia manda a partir de ahí.
 */
export const i18n = createI18n({
  deviceLocale: globalThis.navigator?.language,
  storedLocale: globalThis.localStorage?.getItem(STORAGE_KEY),
  debug: import.meta.env.DEV,
});

export function setLocale(locale: Locale): void {
  globalThis.localStorage?.setItem(STORAGE_KEY, locale);
  void i18n.changeLanguage(locale);
  document.documentElement.lang = locale;
}

export function getLocale(): string {
  return i18n.resolvedLanguage ?? i18n.language;
}

document.documentElement.lang = getLocale();
