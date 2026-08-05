import { z } from 'zod';

import { listAccessEntrySchema } from './list-viewers';

const bucketSchema = z.object({ label: z.string(), accent: z.string(), count: z.number().int() });

/** Un día de **la estela**: viene relleno con ceros, huecos incluidos (§7.4). */
export const listDaySchema = z.object({
  /** `AAAA-MM-DD`, calculado en JS sobre el ISO y no con `EXTRACT(DOW)`. */
  day: z.string(),
  views: z.number().int(),
  visitors: z.number().int(),
});

export type ListDay = z.infer<typeof listDaySchema>;

/**
 * **El solapamiento**: en cuántas listas más está la gente de esta (D36).
 *
 * Es la cuenta que no se puede hacer sin esta funcionalidad y la que un pastor
 * necesita de verdad: quien sale en cinco se está quemando, y hoy eso no lo
 * sabe nadie hasta que se cae.
 */
export const listOverlapSchema = z.object({
  inOtherLists: z.array(
    z.object({
      believerId: z.uuid(),
      name: z.string(),
      listCount: z.number().int(),
    }),
  ),
  sharedWith: z.array(
    z.object({
      listId: z.uuid(),
      name: z.string(),
      accent: z.string(),
      count: z.number().int(),
    }),
  ),
});

export const listStatsSchema = z.object({
  members: z.object({
    total: z.number().int(),
    byCongregation: z.array(bucketSchema),
    byMinistry: z.array(bucketSchema),
    byGift: z.array(bucketSchema),
    byStatus: z.array(bucketSchema),
    withoutCongregation: z.number().int(),
  }),
  overlap: listOverlapSchema,
  audience: z.object({
    views: z.number().int(),
    visitors: z.number().int(),
    firstViewAt: z.string().nullable(),
    lastViewAt: z.string().nullable(),
    days: z.array(listDaySchema),
    byDevice: z.array(bucketSchema),
    byPlatform: z.array(bucketSchema),
    byReferrer: z.array(bucketSchema),
    byHour: z.array(z.object({ hour: z.number().int(), count: z.number().int() })),
    /** Solo en restringida: «cuánta gente» pasa a ser «quién» (D35). */
    byViewer: z.array(
      z.object({
        viewerId: z.uuid(),
        label: z.string(),
        believerId: z.uuid().nullable(),
        believerHasPhoto: z.boolean(),
        views: z.number().int(),
        lastAt: z.string(),
      }),
    ),
  }),
  /** Solo en restringida. `neverEntered` casi siempre dice que el mensaje no llegó. */
  access: z.object({
    granted: z.number().int(),
    neverEntered: z.number().int(),
    failedLast7Days: z.number().int(),
    recent: z.array(listAccessEntrySchema),
  }),
});

export type ListStats = z.infer<typeof listStatsSchema>;

/** Cuántos días dibuja la estela, y cuánto se acota el resto (§ Rendimiento). */
export const LIST_WAKE_DAYS = 30;
export const LIST_OVERLAP_LIMIT = 20;
export const LIST_ACCESS_LOG_LIMIT = 50;

/** A partir de cuántas listas alguien «está en demasiadas» (D36, §8.2). */
export const LIST_OVERLAP_THRESHOLD = 4;

/** Medio año: da para ver el año litúrgico entero sin volverse un archivo (D34). */
export const LIST_RETENTION_DAYS = 180;
