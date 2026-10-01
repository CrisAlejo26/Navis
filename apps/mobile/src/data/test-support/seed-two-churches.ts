import { getDb } from '../db';
import { createChurch } from '../repos/church-repo';
import { createBeliever } from '../repos/believers-repo';
import { createNote } from '../repos/notes-repo';
import { createCongregation, listCalendars } from '../repos/calendar-repo';
import { createCatalogEntry, listGifts, listTags } from '../repos/catalog-repo';
import { createMeeting } from '../repos/calendar-assignments';
import { listPatterns } from '../repos/calendar-settings';

export const ISOLATION_OWNER = 'isolation-owner';
export const ISOLATION_DAY = '2026-09-30';

export async function seedChurch(prefix: string) {
    const db = await getDb();
    const church = await createChurch({
        name: `${prefix}-Iglesia`,
        city: 'Elda',
        ownerId: ISOLATION_OWNER,
    });
    const churchId = church.id;
    await db.runAsync(
        'UPDATE calendars SET name = ? || name WHERE church_id = ?',
        prefix + '-',
        churchId,
    );
    await db.runAsync(
        'UPDATE meeting_patterns SET name = ? || name WHERE church_id = ?',
        prefix + '-',
        churchId,
    );
    const congregation = await createCongregation(churchId, { name: `${prefix}-Sede` });
    const calendar = (await listCalendars(churchId))[0];
    if (!calendar) throw new Error('Falta el calendario sembrado');
    await createCatalogEntry('gifts', churchId, { name: `${prefix}-Don` });
    await createCatalogEntry('tags', churchId, { name: `${prefix}-Etiqueta` });
    const gift = (await listGifts(churchId)).find((one) => one.name === `${prefix}-Don`);
    const tag = (await listTags(churchId)).find((one) => one.name === `${prefix}-Etiqueta`);
    if (!gift || !tag) throw new Error('Faltan los catálogos sembrados');
    const believerId = await createBeliever(churchId, {
        firstName: `${prefix}-Luis`,
        congregationId: congregation.id,
        giftIds: [gift.id],
        tagIds: [tag.id],
    });
    const noteId = await createNote(believerId, churchId, null, {
        kind: 'seguimiento',
        occurredAt: ISOLATION_DAY,
        told: `${prefix}-Nota`,
    });
    // La fixture apunta un archivo virtual: aislar SQL no necesita el disco nativo.
    const audioId = `${prefix}-audio`;
    await db.runAsync(
        'INSERT INTO note_audios (id, created_at, updated_at, church_id, note_id, mime_type, size_bytes, recorded, storage_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        audioId,
        ISOLATION_DAY,
        ISOLATION_DAY,
        churchId,
        noteId,
        'audio/m4a',
        10,
        1,
        `file:///${audioId}`,
    );
    await createMeeting(churchId, calendar.id, {
        name: `${prefix}-Reunión`,
        congregationId: congregation.id,
        date: ISOLATION_DAY,
        startTime: '10:00',
        phases: [{ name: `${prefix}-Fase` }],
    });
    const meeting = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM meetings WHERE church_id = ?',
        churchId,
    );
    const pattern = (await listPatterns(calendar.id, churchId))[0];
    if (!meeting || !pattern) throw new Error('Faltan reunión o patrón');
    return {
        churchId,
        believerId,
        noteId,
        audioId,
        calendarId: calendar.id,
        congregationId: congregation.id,
        giftId: gift.id,
        tagId: tag.id,
        meetingId: meeting.id,
        patternId: pattern.id,
    };
}

export async function seedTwoChurches(): Promise<{
    north: Awaited<ReturnType<typeof seedChurch>>;
    south: Awaited<ReturnType<typeof seedChurch>>;
}> {
    return { north: await seedChurch('N'), south: await seedChurch('S') };
}
