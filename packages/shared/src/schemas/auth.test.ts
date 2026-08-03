import { describe, expect, it } from 'vitest';

import { loginSchema, passwordSchema, passwordStrength, registerSchema } from './auth';

describe('passwordSchema', () => {
  it('rechaza contraseñas cortas o sin variedad de caracteres', () => {
    expect(passwordSchema.safeParse('corta1A').success).toBe(false);
    expect(passwordSchema.safeParse('todominusculas1').success).toBe(false);
    expect(passwordSchema.safeParse('SinNumerosAqui').success).toBe(false);
  });

  it('acepta una contraseña válida', () => {
    expect(passwordSchema.safeParse('Rebano2026Seguro').success).toBe(true);
  });
});

describe('passwordStrength', () => {
  it('no puntúa una contraseña vacía', () => {
    expect(passwordStrength('')).toBe(0);
  });

  it('sube según se cumplen los requisitos', () => {
    expect(passwordStrength('corta')).toBe(0);
    expect(passwordStrength('sinmayusculas')).toBe(1);
    expect(passwordStrength('MinusYMayus')).toBe(2);
    expect(passwordStrength('Rebano2026')).toBe(3);
  });

  // El medidor y la validación cuentan lo mismo: lo que pasa el esquema no
  // puede aparecer como «débil» en la interfaz.
  it('nunca baja de 3 en una contraseña que el esquema acepta', () => {
    for (const value of ['Rebano2026', 'Aa1bbbbbbb', 'Zz9xxxxxxx']) {
      expect(passwordSchema.safeParse(value).success).toBe(true);
      expect(passwordStrength(value)).toBeGreaterThanOrEqual(3);
    }
  });

  it('da el máximo con longitud o con símbolos', () => {
    expect(passwordStrength('Rebano2026Seguro')).toBe(4);
    expect(passwordStrength('Rebano2026!')).toBe(4);
  });
});

describe('loginSchema', () => {
  it('normaliza el email a minúsculas y sin espacios', () => {
    const result = loginSchema.parse({
      email: '  Pastor@Iglesia.ES ',
      password: 'x',
      rememberMe: true,
    });
    expect(result.email).toBe('pastor@iglesia.es');
  });

  // `rememberMe` no tiene `.default()` a propósito: con un valor por defecto,
  // el tipo de entrada y el de salida dejarían de coincidir y react-hook-form
  // rechazaría el resolver. El formulario es quien lo envía siempre.
  it('exige rememberMe explícito', () => {
    expect(() => loginSchema.parse({ email: 'a@b.es', password: 'x' })).toThrow();
  });
});

describe('registerSchema', () => {
  it('exige nombre, email y contraseña fuerte', () => {
    const result = registerSchema.safeParse({
      email: 'pastor@iglesia.es',
      password: 'Rebano2026Seguro',
      name: 'Pastor Ejemplo',
    });
    expect(result.success).toBe(true);
  });
});
