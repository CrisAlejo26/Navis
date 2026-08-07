import { z } from 'zod';

/** Perfil de dominio (tabla `profiles`, gestionada por TypeORM). */
export const profileSchema = z.object({
  id: z.uuid(),
  userId: z.string(),
  phone: z.string().nullable(),
  church: z.string().nullable(),
  /** Para el tiempo del panel de inicio. */
  city: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  timezone: z.string(),
  /** Solo tiene efecto para el rol `superadmin` (RFC 0014). */
  restrictOwnScope: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Profile = z.infer<typeof profileSchema>;

export const updateProfileSchema = z.object({
  phone: z.string().max(25).optional(),
  church: z.string().min(2).max(160).optional(),
  /** Vacía para dejar de enseñar el tiempo. */
  city: z.string().max(120).optional(),
  avatarUrl: z.url().optional(),
  bio: z.string().max(500).optional(),
  timezone: z.string().min(3).max(64).optional(),
  restrictOwnScope: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
