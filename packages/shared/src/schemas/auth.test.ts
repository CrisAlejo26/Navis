import { describe, expect, it } from 'vitest';

import { loginSchema, passwordSchema, registerSchema } from './auth';

describe('passwordSchema', () => {
  it('rechaza contraseñas cortas o sin variedad de caracteres', () => {
    expect(passwordSchema.safeParse('corta1A').success).toBe(false);
    expect(passwordSchema.safeParse('todominusculas1').success).toBe(false);
    expect(passwordSchema.safeParse('SinNumerosAqui').success).toBe(false);
  });

  it('acepta una contraseña válida', () => {
    expect(passwordSchema.safeParse('PastorTools2026').success).toBe(true);
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
      password: 'PastorTools2026',
      name: 'Pastor Ejemplo',
    });
    expect(result.success).toBe(true);
  });
});
