import { z } from 'zod';

import { ROLES } from '../constants';

/**
 * Política de contraseñas. Se usa en los formularios de web/móvil y también
 * la aplica Better Auth en el servidor (minPasswordLength), de modo que la
 * regla vive en un único sitio.
 */
export const passwordSchema = z
  .string()
  .min(10, 'La contraseña debe tener al menos 10 caracteres')
  .max(128)
  .refine((value) => /[a-z]/.test(value), 'Debe incluir una minúscula')
  .refine((value) => /[A-Z]/.test(value), 'Debe incluir una mayúscula')
  .refine((value) => /\d/.test(value), 'Debe incluir un número');

// El orden importa: primero se normaliza (trim + minúsculas) y DESPUÉS se
// valida, para que "  Pastor@Iglesia.ES " sea un email válido.
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Email no válido').max(255));

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
  // Sin `.default()`: con un valor por defecto el tipo de entrada y el de
  // salida dejarían de coincidir y react-hook-form rechazaría el resolver.
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'El nombre es obligatorio').max(120).trim(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Forma del usuario que devuelve Better Auth (tabla `user`), incluido el
 * campo adicional `role` que declaramos en la configuración del servidor.
 */
export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullable().optional(),
  role: z.enum(ROLES),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PublicUser = z.infer<typeof publicUserSchema>;

/** Sesión activa tal y como la persiste Better Auth en la tabla `session`. */
export const sessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  ipAddress: z.string().nullable().optional(),
  userAgent: z.string().nullable().optional(),
});

export type Session = z.infer<typeof sessionSchema>;

export const sessionResponseSchema = z.object({
  user: publicUserSchema,
  session: sessionSchema,
});

export type SessionResponse = z.infer<typeof sessionResponseSchema>;
