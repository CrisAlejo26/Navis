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
    const result = loginSchema.parse({ email: '  Pastor@Iglesia.ES ', password: 'x' });
    expect(result.email).toBe('pastor@iglesia.es');
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
