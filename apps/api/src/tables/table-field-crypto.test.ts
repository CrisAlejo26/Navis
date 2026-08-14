import { describe, expect, it } from 'vitest';

import { decryptTableField, encryptTableField, isEncryptedTableField } from './table-field-crypto';

describe('cifrado de un campo de tipo contraseña', () => {
  it('descifra a lo que se cifró', () => {
    const cifrado = encryptTableField('la clave del router del salón');
    expect(decryptTableField(cifrado)).toBe('la clave del router del salón');
  });

  it('cifra distinto cada vez, por el IV al azar', () => {
    const a = encryptTableField('portal-2026');
    const b = encryptTableField('portal-2026');
    expect(a).not.toBe(b);
    expect(decryptTableField(a)).toBe(decryptTableField(b));
  });

  it('no deja el texto claro visible dentro del valor cifrado', () => {
    expect(encryptTableField('secreto-visible')).not.toContain('secreto-visible');
  });

  it('reconoce un valor cifrado por su forma', () => {
    expect(isEncryptedTableField(encryptTableField('x'))).toBe(true);
    expect(isEncryptedTableField('texto en claro sin puntos')).toBe(false);
    expect(isEncryptedTableField(42)).toBe(false);
  });

  it('rechaza un valor con menos de tres partes', () => {
    expect(() => decryptTableField('solo.dos')).toThrow();
  });
});
