import type { LocalDb } from '../local-db';
export async function preacherMinistries(
    db: LocalDb,
    churchId: string,
    ids: readonly string[],
): Promise<Map<string, string[]>> {
    const ministriesOf = new Map<string, string[]>();
    if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(', ');
        for (const row of await db.getAllAsync<{ believer_id: string; ministry: string }>(
            `SELECT believer_id, ministry FROM believer_ministries
       WHERE believer_id IN (${placeholders}) AND deleted_at IS NULL AND believer_ministries.believer_id IN (SELECT id FROM believers WHERE church_id = ? AND deleted_at IS NULL) `,
            ...ids,
            churchId,
        )) {
            ministriesOf.set(row.believer_id, [
                ...(ministriesOf.get(row.believer_id) ?? []),
                row.ministry,
            ]);
        }
    }

    return ministriesOf;
}
