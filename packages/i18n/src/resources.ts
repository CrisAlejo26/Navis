import type { Locale } from '@navis/shared';

import { de } from './locales/de';
import { en } from './locales/en';
import { es, type Translation } from './locales/es';
import { fr } from './locales/fr';
import { it } from './locales/it';
import { pt } from './locales/pt';

export const defaultNS = 'translation';

/**
 * Los seis idiomas se empaquetan con la app: son ficheros pequeños y así
 * cambiar de idioma es instantáneo y funciona sin conexión (importante en la
 * PWA y en la app móvil).
 */
export const resources = {
  es: { translation: es },
  en: { translation: en },
  fr: { translation: fr },
  pt: { translation: pt },
  de: { translation: de },
  it: { translation: it },
} as const satisfies Record<Locale, { translation: Translation }>;

export type Resources = typeof resources;
export type { Translation };
