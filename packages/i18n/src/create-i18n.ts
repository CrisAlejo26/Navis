import { DEFAULT_LOCALE, isLocale, type Locale, LOCALES, normalizeLocale } from '@navis/shared';
import i18next, { type i18n as I18nInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { defaultNS, resources } from './resources';

export interface CreateI18nOptions {
  /**
   * Idioma del dispositivo (navigator.language en web, expo-localization en
   * móvil). Se normaliza a uno de los soportados; si no hay equivalente,
   * se usa español.
   */
  deviceLocale?: string | null;
  /** Idioma elegido manualmente por el usuario; tiene prioridad. */
  storedLocale?: string | null;
  debug?: boolean;
}

export function resolveInitialLocale({
  deviceLocale,
  storedLocale,
}: CreateI18nOptions = {}): Locale {
  const stored = storedLocale?.toLowerCase().split(/[-_]/)[0];
  // La elección explícita del usuario gana; si no hay, manda el dispositivo.
  if (stored && isLocale(stored)) return stored;
  return normalizeLocale(deviceLocale);
}

/**
 * Crea e inicializa la instancia de i18next compartida por web y móvil.
 * Idempotente: si ya estaba inicializada devuelve la misma instancia.
 */
export function createI18n(options: CreateI18nOptions = {}): I18nInstance {
  const lng = resolveInitialLocale(options);

  if (!i18next.isInitialized) {
    void i18next.use(initReactI18next).init({
      resources,
      lng,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...LOCALES],
      defaultNS,
      ns: [defaultNS],
      debug: options.debug ?? false,
      // Las traducciones van en el bundle, no se descargan: inicializar de
      // forma síncrona hace que el primer render ya salga traducido, sin el
      // aviso de react-i18next ni un parpadeo con las claves en crudo.
      initAsync: false,
      interpolation: { escapeValue: false },
      returnNull: false,
    });
  }

  return i18next;
}

export const i18n = i18next;
