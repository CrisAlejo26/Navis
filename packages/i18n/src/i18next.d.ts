import type { Translation } from './resources';

/**
 * Tipado estricto de i18next: `t('nav.dashboard')` autocompleta y una clave
 * inexistente es un error de compilación en web y en móvil.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: Translation;
    };
    returnNull: false;
  }
}

export {};
