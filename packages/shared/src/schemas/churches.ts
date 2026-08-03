import { z } from 'zod';

/**
 * Una iglesia: el espacio de trabajo (RFC 0008). Todo lo pastoral —creyentes,
 * calendario, comunicaciones— cuelga de una de estas.
 *
 * No confundir con un creyente: esto es la congregación, no una persona.
 */
export const churchSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  /** Derivado del nombre por el servidor; estable, para rutas y registros. */
  slug: z.string(),
  /** Nulo solo en las iglesias que vienen del traspaso de una instalación vieja. */
  city: z.string().nullable(),
  timezone: z.string(),
  /** Quién la creó. Nunca se queda sin dueño. */
  ownerId: z.string(),
  createdAt: z.coerce.date(),
});

export type Church = z.infer<typeof churchSchema>;

/**
 * El alta pide **dos datos y ya**: el nombre y la ciudad. Es lo primero que ve
 * quien puede crear iglesias, y una pantalla de bienvenida con diez campos es
 * una pantalla que se abandona. Todo lo demás se edita después.
 */
export const createChurchSchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la iglesia es obligatorio').max(120),
  city: z.string().trim().min(2, 'La ciudad es obligatoria').max(120),
});

export type CreateChurchInput = z.infer<typeof createChurchSchema>;

export const updateChurchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  city: z.string().trim().min(2).max(120).optional(),
  timezone: z.string().min(3).max(64).optional(),
});

export type UpdateChurchInput = z.infer<typeof updateChurchSchema>;

/**
 * Las iglesias a las que se llega y en cuál se está trabajando.
 *
 * La activa viaja aquí y **no dentro de la sesión**: Better Auth cachea la
 * sesión en una cookie durante cinco minutos, así que un cambio de iglesia
 * tardaría ese rato en notarse. Al venir con el listado, se refresca al
 * invalidar la consulta.
 */
export const myChurchesSchema = z.object({
  items: z.array(churchSchema),
  activeId: z.string().nullable(),
});

export type MyChurches = z.infer<typeof myChurchesSchema>;

export const setActiveChurchSchema = z.object({ churchId: z.uuid() });

export type SetActiveChurchInput = z.infer<typeof setActiveChurchSchema>;
