import { describe, expect, it } from 'vitest';

import {
  LIST_TOKEN_LENGTH,
  generateListShareToken,
  isListShareToken,
  listPublicPath,
  listSharePath,
  listShareUrl,
} from './list-share';

describe('el enlace de una lista', () => {
  it('genera un token de 22 caracteres en base64url', () => {
    const token = generateListShareToken();
    expect(token).toHaveLength(LIST_TOKEN_LENGTH);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('no repite: es un secreto, no un nombre', () => {
    const tokens = new Set(Array.from({ length: 500 }, generateListShareToken));
    expect(tokens.size).toBe(500);
  });

  it('acepta lo que genera y rechaza lo que no tiene esa forma', () => {
    expect(isListShareToken(generateListShareToken())).toBe(true);
    expect(isListShareToken('pulpito')).toBe(false);
    expect(isListShareToken('a'.repeat(21))).toBe(false);
    expect(isListShareToken('a'.repeat(23))).toBe(false);
    expect(isListShareToken('aaaaaaaaaaaaaaaaaaaa+/')).toBe(false);
  });

  it('arma la ruta del documento y la de la SPA, que no son la misma', () => {
    expect(listSharePath('abc')).toBe('/l/abc');
    expect(listPublicPath('abc')).toBe('/lists/s/abc');
  });

  it('no duplica la barra al armar la URL entera', () => {
    expect(listShareUrl('https://navis.example/', 'abc')).toBe('https://navis.example/l/abc');
    expect(listShareUrl('https://navis.example', 'abc')).toBe('https://navis.example/l/abc');
  });
});
