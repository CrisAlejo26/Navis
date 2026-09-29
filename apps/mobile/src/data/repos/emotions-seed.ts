import type { LocalDb } from '../local-db';
import { newId, nowIso } from '../local-db';

/**
 * Las doce emociones de serie de sueños, **escritas literalmente** (RFC 0005
 * D5): son las mismas —slug, color y orden— que siembra la migración
 * `CreateDreams` de la API. No se importa una constante de `@navis/shared`: una
 * migración que depende de un valor que puede cambiar deja de estar congelada.
 * No llevan nombre: el texto sale de `dreams.emotions.<slug>` (D4).
 */
const SYSTEM_EMOTIONS: readonly (readonly [slug: string, accent: string])[] = [
    ['felicidad', '#ca8a04'],
    ['alegria', '#ea580c'],
    ['tranquilidad', '#0d9488'],
    ['paz', '#16a34a'],
    ['esperanza', '#0284c7'],
    ['libertad', '#0891b2'],
    ['curiosidad', '#9333ea'],
    ['confusion', '#6d28d9'],
    ['ansiedad', '#db2777'],
    ['tristeza', '#4f46e5'],
    ['miedo', '#57534e'],
    ['persecucion', '#dc2626'],
];

/** Idempotente: solo inserta las que falten, así que sirve para una base nueva y para una vieja. */
export async function seedSystemEmotions(db: LocalDb): Promise<void> {
    const existing = new Set(
        (
            await db.getAllAsync<{ slug: string }>(
                'SELECT slug FROM emotions WHERE slug IS NOT NULL AND deleted_at IS NULL',
            )
        ).map((row) => row.slug),
    );
    const now = nowIso();
    for (const [position, [slug, accent]] of SYSTEM_EMOTIONS.entries()) {
        if (existing.has(slug)) continue;
        await db.runAsync(
            'INSERT INTO emotions (id, created_at, updated_at, deleted_at, owner_id, slug, name, accent, position) VALUES (?, ?, ?, NULL, NULL, ?, NULL, ?, ?)',
            newId(),
            now,
            now,
            slug,
            accent,
            position,
        );
    }
}
