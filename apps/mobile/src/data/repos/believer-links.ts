import { nowIso } from '../db';
import type { LocalDb } from '../local-db';
import { validateBelieverReferences } from './believer-references';
import type { WriteBelieverInput } from './believer-input';
import { replaceLinks } from './believer-link-writes';
export async function applyLinks(
    db: LocalDb,
    id: string,
    input: Partial<WriteBelieverInput>,
    churchId: string,
): Promise<void> {
    await validateBelieverReferences(db, churchId, input);
    if (input.ministries) {
        await replaceLinks(
            db,
            id,
            'believer_ministries',
            'ministry',
            input.ministries,
            'started_at',
            input.ministryDates,
            null,
            churchId,
        );
    }
    if (input.giftIds) {
        await replaceLinks(
            db,
            id,
            'believer_gifts',
            'gift_id',
            input.giftIds,
            'received_at',
            input.giftDates,
            null,
            churchId,
        );
    }
    if (input.tagIds) {
        // El destacado **manda la lista, no la petición**: si llega uno que no
        // está entre las suyas, se cae aquí (como en la API).
        const featured = input.tagIds.includes(input.featuredTagId ?? '')
            ? input.featuredTagId
            : null;
        await replaceLinks(
            db,
            id,
            'believer_tag_links',
            'tag_id',
            input.tagIds,
            null,
            {},
            featured,
            churchId,
        );
    } else if (input.featuredTagId !== undefined) {
        // Sin cambio de lista, el destacado solo se apunta si ya tiene la etiqueta.
        const has = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM believer_tag_links WHERE believer_id = ? AND tag_id = ? AND deleted_at IS NULL AND believer_tag_links.believer_id IN (SELECT id FROM believers WHERE church_id = ? AND deleted_at IS NULL) ',
            id,
            input.featuredTagId,
            churchId,
        );
        if (has) {
            await db.runAsync(
                'UPDATE believers SET featured_tag_id = ?, updated_at = ? WHERE id = ? AND believers.church_id = ? ',
                input.featuredTagId,
                nowIso(),
                id,
                churchId,
            );
        }
    }
}
