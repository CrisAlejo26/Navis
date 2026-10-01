import type { LocalDb } from '../local-db';

export interface LocalMeetingSlot {
    id: string;
    name: string;
    position: number;
    note: string | null;
}
export async function listMeetingSlots(
    db: LocalDb,
    churchId: string,
    meetingId: string,
): Promise<LocalMeetingSlot[]> {
    return db.getAllAsync<LocalMeetingSlot>(
        'SELECT id, name, position, note FROM meeting_slots WHERE meeting_id = ? AND meeting_id IN (SELECT id FROM meetings WHERE church_id = ? AND deleted_at IS NULL) ORDER BY position ASC',
        meetingId,
        churchId,
    );
}
