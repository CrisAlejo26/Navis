import {
    createListSchema,
    updateListSchema,
    toSearchName,
    type CreateListInput,
    type UpdateListInput,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';
import { readLists } from './lists-reads';
export { readLists, readListMembers, listCandidates } from './lists-reads';
export type { ListContext } from './lists-context';

export async function createList(context: ListContext, input: CreateListInput): Promise<string> {
    const values = createListSchema.parse(input);
    const db = await listDb(context, true);
    const id = newId();
    await db.withTransactionAsync(async () => {
        const existing = await readLists(context, false);
        const base =
            toSearchName(values.name)
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '') || 'lista';
        let slug = base;
        let suffix = 2;
        while (existing.some((one) => one.slug === slug)) slug = `${base}-${suffix++}`;
        const now = nowIso();
        await db.runAsync(
            `INSERT INTO lists (id, created_at, updated_at, church_id, name, slug, description, accent, position, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            id,
            now,
            now,
            context.churchId,
            values.name,
            slug,
            values.description || null,
            values.accent ?? 'primary',
            Math.max(-1, ...existing.map((one) => one.position)) + 1,
            context.userId,
        );
    });
    return id;
}

export async function updateList(
    context: ListContext,
    id: string,
    input: UpdateListInput,
): Promise<void> {
    const values = updateListSchema.parse(input);
    const db = await listDb(context, true, id);
    const fields: string[] = [];
    const params: (string | number | null)[] = [];
    const mapping = {
        name: 'name',
        description: 'description',
        accent: 'accent',
        position: 'position',
        isActive: 'is_active',
        allowDownload: 'allow_download',
    } as const;
    for (const key of Object.keys(mapping) as (keyof typeof mapping)[]) {
        const value = values[key];
        if (value === undefined) continue;
        fields.push(`${mapping[key]} = ?`);
        params.push(typeof value === 'boolean' ? Number(value) : value);
    }
    if (!fields.length) return;
    await db.runAsync(
        `UPDATE lists SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND church_id = ?`,
        ...params,
        nowIso(),
        id,
        context.churchId,
    );
}

export async function deleteList(context: ListContext, id: string): Promise<void> {
    const db = await listDb(context, true, id);
    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM list_grants WHERE list_id = ?', id);
        await db.runAsync('DELETE FROM list_members WHERE list_id = ?', id);
        await db.runAsync(
            `UPDATE lists SET deleted_at = ?, updated_at = ?, visibility = 'private', share_token = NULL, shared_at = NULL WHERE id = ? AND church_id = ?`,
            nowIso(),
            nowIso(),
            id,
            context.churchId,
        );
    });
}
