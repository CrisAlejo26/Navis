import { describe, expect, it } from 'vitest';

import { resolveInitialLocale } from './create-i18n';
import { resources } from './resources';

describe('resolveInitialLocale', () => {
  it('usa el idioma del dispositivo cuando está soportado', () => {
    expect(resolveInitialLocale({ deviceLocale: 'fr-FR' })).toBe('fr');
    expect(resolveInitialLocale({ deviceLocale: 'pt-BR' })).toBe('pt');
    expect(resolveInitialLocale({ deviceLocale: 'de_AT' })).toBe('de');
  });

  it('cae al español si el idioma del dispositivo no está soportado', () => {
    expect(resolveInitialLocale({ deviceLocale: 'ja-JP' })).toBe('es');
    expect(resolveInitialLocale({})).toBe('es');
  });

  it('da prioridad a la preferencia guardada por el usuario', () => {
    expect(resolveInitialLocale({ deviceLocale: 'en-US', storedLocale: 'it' })).toBe('it');
  });

  it('ignora una preferencia guardada inválida', () => {
    expect(resolveInitialLocale({ deviceLocale: 'en-US', storedLocale: 'xx' })).toBe('en');
  });
});

describe('resources', () => {
  it('tiene las mismas claves en los seis idiomas', () => {
    const flatten = (obj: object, prefix = ''): string[] =>
      Object.entries(obj).flatMap(([key, value]) =>
        typeof value === 'object' && value !== null
          ? flatten(value as object, `${prefix}${key}.`)
          : [`${prefix}${key}`],
      );

    const reference = flatten(resources.es.translation).sort();

    for (const [locale, bundle] of Object.entries(resources)) {
      expect(flatten(bundle.translation).sort(), `faltan claves en ${locale}`).toEqual(reference);
    }
  });
});
