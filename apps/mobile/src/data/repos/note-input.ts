import type { NoteKind } from '@navis/shared';
export interface WriteNoteInput {
    kind: NoteKind;
    occurredAt: string;
    told: string;
    advice?: string | null;
    giftId?: string | null;
    remindAt?: string | null;
    remindText?: string | null;
}
