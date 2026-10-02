import { getDb } from './db';
import { createList, type ListContext } from './repos/lists-repo';
import { addListMembers, updateMemberNote } from './repos/list-members-writes';
import { updateList } from './repos/lists-repo';

import { DEMO_LIST_EXAMPLES } from './demo-list-examples';

const pending = new Map<string, Promise<void>>();
/** Demo por iglesia: completa ejemplos ausentes, sin reemplazar ni revivir datos existentes. */
export async function seedDemoLists(churchId: string, userId: string): Promise<void> {
    const key = `${churchId}:${userId}`;
    const running = pending.get(key);
    if (running) return running;
    const seed = populate({ churchId, userId });
    pending.set(key, seed);
    try {
        await seed;
    } finally {
        pending.delete(key);
    }
}

async function populate(context: ListContext) {
    const db = await getDb();
    const church = await db.getFirstAsync<{ owner_id: string }>(
        'SELECT owner_id FROM churches WHERE id = ? AND deleted_at IS NULL',
        context.churchId,
    );
    if (church?.owner_id !== context.userId) return;
    const believers = await db.getAllAsync<{ id: string; first_name: string }>(
        'SELECT id, first_name FROM believers WHERE church_id = ? AND deleted_at IS NULL ORDER BY created_at, id',
        context.churchId,
    );
    if (!believers.length) return;
    const existing = await db.getAllAsync<{ slug: string; name: string }>(
        'SELECT slug, name FROM lists WHERE church_id = ?',
        context.churchId,
    );
    for (const example of DEMO_LIST_EXAMPLES) {
        if (existing.some((one) => one.slug === example.slug || one.name === example.name))
            continue;
        const id = await createList(context, example);
        const ids = example.people.flatMap((name) => {
            const believer = believers.find((one) => one.first_name === name);
            return believer ? [believer.id] : [];
        });
        if (ids.length) {
            await addListMembers(context, id, ids);
            await updateMemberNote(context, id, ids[0], example.note);
        }
        if ('inactive' in example) await updateList(context, id, { isActive: false });
    }
}
