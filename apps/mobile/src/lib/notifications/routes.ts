import type { Href } from 'expo-router';
import { z } from 'zod';

/**
 * Lo que viaja dentro de cada notificación, y a dónde lleva al tocarla.
 *
 * El `data` de una notificación llega como `unknown` desde el sistema
 * operativo (Regla 10): se valida antes de navegar. Un tipo nuevo de aviso es
 * un caso más de esta unión y una rama más de `hrefForNotice`.
 */
export const noticeDataSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('note-reminder'),
        churchId: z.string().min(1),
        believerId: z.string().min(1),
        noteId: z.string().min(1),
    }),
]);

export type NoticeData = z.infer<typeof noticeDataSchema>;

/** La pantalla a la que lleva un aviso, o `null` si el `data` no es de Navis. */
export function hrefForNotice(data: unknown): Href | null {
    const parsed = noticeDataSchema.safeParse(data);
    if (!parsed.success) return null;
    // La página de la nota: se llega a **leerla**, no al formulario de edición.
    return { pathname: '/believers/notes/[id]', params: { id: parsed.data.noteId } };
}
