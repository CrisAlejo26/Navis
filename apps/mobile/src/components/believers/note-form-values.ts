import type { BelieverNote, CreateNoteInput, NoteKind } from '@navis/shared';

import { todayIso } from '@/data/repos/dashboard-repo';
import type { WriteNoteInput } from '@/data/repos/notes-repo';

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

/** «9:30» y «09:30» valen los dos; «25:00» o «9» no. Devuelve `HH:mm` o `null`. */
export function normalizeTime(text: string): string | null {
    const match = /^(\d{1,2}):(\d{2})$/.exec(text.trim());
    if (!match) return null;
    const [hours, minutes] = [Number(match[1]), Number(match[2])];
    if (hours > 23 || minutes > 59) return null;
    return `${String(hours).padStart(2, '0')}:${match[2]}`;
}

/** Cuándo suena el recordatorio del formulario, o `null` si no está completo. */
export function remindAtOf(values: NoteFormValues): string | null {
    const time = normalizeTime(values.remindTime);
    if (!values.remindOn || !values.remindDate || !time) return null;
    return `${values.remindDate}T${time}:00`;
}

/** El input del repo, ya validado en forma: el tipo «don» exige don (D8). */
export function toNoteInput(
    values: NoteFormValues,
): CreateNoteInput | { error: 'gift' | 'reminder' } {
    if (values.kind === 'don' && !values.giftId) return { error: 'gift' };
    // Un recordatorio encendido sin día o sin una hora válida no avisaría de
    // nada: mejor decirlo aquí que guardarlo mudo.
    if (values.remindOn && remindAtOf(values) === null) return { error: 'reminder' };
    return {
        kind: values.kind,
        occurredAt: values.occurredAt,
        told: values.told.trim(),
        advice: values.advice.trim() || undefined,
        giftId: values.kind === 'don' ? (values.giftId ?? undefined) : undefined,
        remindAt: remindAtOf(values) ?? undefined,
        remindText: values.remindOn ? values.remindText.trim() || undefined : undefined,
    };
}

/**
 * Lo que se manda al **editar**: en una edición `undefined` significa «no
 * tocar», así que lo que el formulario dejó vacío se pasa como `null` para que
 * de verdad se borre (quitar el recordatorio, vaciar la indicación). Un
 * recordatorio movido vuelve a estar pendiente aunque ya se hubiera dado por
 * hecho.
 */
export function toUpdateInput(
    input: WriteNoteInput,
    previous: Pick<BelieverNote, 'remindAt'>,
): Partial<WriteNoteInput> & { remindDone?: boolean } {
    return {
        ...input,
        advice: input.advice ?? null,
        giftId: input.giftId ?? null,
        remindAt: input.remindAt ?? null,
        remindText: input.remindText ?? null,
        ...(input.remindAt !== previous.remindAt ? { remindDone: false } : {}),
    };
}
