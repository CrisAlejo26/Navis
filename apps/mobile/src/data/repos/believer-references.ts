import type { WriteBelieverInput } from './believers-repo';
import type { LocalDb } from '../local-db';
import { assertInChurch, assertAllInChurch } from '../church-scope';

export async function validateBelieverReferences(
    db: LocalDb,
    churchId: string,
    input: Partial<WriteBelieverInput>,
): Promise<void> {
    if (input.congregationId)
        await assertInChurch(db, 'congregations', input.congregationId, churchId);
    await assertAllInChurch(db, 'gifts', input.giftIds ?? [], churchId);
    await assertAllInChurch(db, 'believer_tags', input.tagIds ?? [], churchId);
    if (input.featuredTagId)
        await assertInChurch(db, 'believer_tags', input.featuredTagId, churchId);
}
