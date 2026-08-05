import { describe, expect, it } from 'vitest';

import {
  LIST_PASSWORD_ALPHABET,
  generateListPassword,
  listPasswordSchema,
  normalizeListPassword,
} from './list-password';

describe('la contraseña de un acceso', () => {
  it('sale en tres grupos de cuatro separados por guiones', () => {
    expect(generateListPassword()).toMatch(/^[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/);
  });

  it('no usa ningún carácter de los que se confunden al dictarla', () => {
    const confusos = ['0', 'o', '1', 'l', 'i', '5', 's', '2', 'z'];
    for (const caracter of confusos) expect(LIST_PASSWORD_ALPHABET).not.toContain(caracter);
  });

  it('solo usa caracteres del alfabeto acordado', () => {
    for (let vez = 0; vez < 200; vez += 1) {
      for (const caracter of normalizeListPassword(generateListPassword())) {
        expect(LIST_PASSWORD_ALPHABET).toContain(caracter);
      }
    }
  });

  it('no repite dos seguidas', () => {
    const generadas = new Set(Array.from({ length: 200 }, generateListPassword));
    expect(generadas.size).toBe(200);
  });

  it('reparte el alfabeto entero, sin dejar caracteres fuera', () => {
    const vistos = new Set<string>();
    for (let vez = 0; vez < 2000; vez += 1) {
      for (const caracter of normalizeListPassword(generateListPassword())) vistos.add(caracter);
    }
    expect(vistos.size).toBe(LIST_PASSWORD_ALPHABET.length);
  });

  it('quita los guiones y los espacios al normalizarla, para que entre escrita de corrido', () => {
    expect(normalizeListPassword('k7fr-m3np-t9wx')).toBe('k7frm3npt9wx');
    expect(normalizeListPassword(' k7fr m3np t9wx ')).toBe('k7frm3npt9wx');
  });

  it('no cambia de caja: quien escriba la suya con mayúsculas espera que cuenten', () => {
    expect(normalizeListPassword('Ancianos-2026')).toBe('Ancianos2026');
  });

  it('mide sin los guiones: ocho caracteres separados valen', () => {
    expect(listPasswordSchema.safeParse('abcd-efgh').success).toBe(true);
    expect(listPasswordSchema.safeParse('abcd-efg').success).toBe(false);
  });

  it('acepta la que genera ella misma', () => {
    expect(listPasswordSchema.safeParse(generateListPassword()).success).toBe(true);
  });
});
