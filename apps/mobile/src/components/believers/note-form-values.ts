import type { BelieverNote, CreateNoteInput, NoteKind } from '@navis/shared';

import { todayIso } from '@/data/repos/dashboard-repo';

/**
 * El estado y la validación del formulario de nota, **sin React**: por eso
 * vive aparte de la hoja — lo prueban los tests sin montar `expo-audio`.
 */

export interface NoteFormValues {
    kind: NoteKind;
    occurredAt: string;
    told: string;
    advice: string;
    giftId: string | null;
    remindOn: boolean;
    remindDate: string | null;
    remindTime: string;
    remindText: string;
}

export function emptyNoteForm(): NoteFormValues {
    return {
        kind: 'seguimiento',
        occurredAt: todayIso(),
        told: '',
        advice: '',
        giftId: null,
        remindOn: false,
        remindDate: null,
        remindTime: '19:00',
        remindText: '',
    };
}

export function noteFormFrom(note: BelieverNote): NoteFormValues {
    return {
        kind: note.kind,
        occurredAt: note.occurredAt,
        told: note.told,
        advice: note.advice ?? '',
        giftId: note.giftId,
        remindOn: note.remindAt !== null,
        remindDate: note.remindAt ? note.remindAt.slice(0, 10) : null,
        remindTime: note.remindAt ? note.remindAt.slice(11, 16) : '19:00',
        remindText: note.remindText ?? '',
    };
}

/** El input del repo, ya validado en forma: el tipo «don» exige don (D8). */
export function toNoteInput(
    values: NoteFormValues,
): CreateNoteInput | { error: 'gift' | 'reminder' } {
    if (values.kind === 'don' && !values.giftId) return { error: 'gift' };
    if (
        values.remindText.trim() &&
        (!values.remindDate || !/^\d{2}:\d{2}$/.test(values.remindTime))
    ) {
        return { error: 'reminder' };
    }
    return {
        kind: values.kind,
        occurredAt: values.occurredAt,
        told: values.told.trim(),
        advice: values.advice.trim() || undefined,
        giftId: values.kind === 'don' ? (values.giftId ?? undefined) : undefined,
        remindAt:
            values.remindOn && values.remindDate
                ? `${values.remindDate}T${values.remindTime}:00`
                : undefined,
        remindText: values.remindOn ? values.remindText.trim() || undefined : undefined,
    };
}
