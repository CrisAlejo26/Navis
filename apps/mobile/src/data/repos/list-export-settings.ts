import { listPublicFieldsSchema, type ListPublicFields } from '@navis/shared';
import { nowIso } from '../db';
import { listDb, type ListContext } from './lists-context';

export async function saveListExportFields(
    context: ListContext,
    id: string,
    fields: ListPublicFields,
): Promise<void> {
    const values = listPublicFieldsSchema.parse(fields);
    const db = await listDb(context, true, id);
    await db.runAsync(
        'UPDATE lists SET public_fields = ?, updated_at = ? WHERE id = ? AND church_id = ?',
        JSON.stringify(values),
        nowIso(),
        id,
        context.churchId,
    );
}
