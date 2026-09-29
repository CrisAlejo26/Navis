import {
    emptyNoteForm,
    normalizeTime,
    toNoteInput,
    toUpdateInput,
} from '@/components/believers/note-form-values';

/** El tipo «don» exige don (D8) y un recordatorio sin fecha no recuerda nada (D16). */
describe('toNoteInput', () => {
    const base = { ...emptyNoteForm(), told: 'Contó que estaba mejor' };

    it('una nota normal sale tal cual', () => {
        const input = toNoteInput(base);
        expect(input).toMatchObject({ kind: 'seguimiento', told: 'Contó que estaba mejor' });
        expect('error' in input && input.error).toBeFalsy();
    });

    it('anotar un don sin elegir don no pasa la validación', () => {
        const input = toNoteInput({ ...base, kind: 'don' });
        expect(input).toEqual({ error: 'gift' });
    });

    it('un recordatorio necesita día y hora', () => {
        const input = toNoteInput({
            ...base,
            remindOn: true,
            remindText: 'Llamarle',
            remindDate: null,
        });
        expect(input).toEqual({ error: 'reminder' });
    });

    it('el recordatorio completo viaja como instante', () => {
        const input = toNoteInput({
            ...base,
            remindOn: true,
            remindText: 'Preguntarle',
            remindDate: '2026-09-20',
            remindTime: '19:30',
        });
        expect(input).toMatchObject({ remindAt: '2026-09-20T19:30:00', remindText: 'Preguntarle' });
    });

    it('la indicación vacía no viaja: a veces solo se escucha (D15)', () => {
        const input = toNoteInput(base);
        expect('advice' in input ? input.advice : undefined).toBeUndefined();
    });
});

describe('la hora del recordatorio', () => {
    const base = { ...emptyNoteForm(), told: 'Algo', remindOn: true, remindDate: '2026-09-20' };

    it('acepta 9:30 y 09:30, y rechaza lo que no es una hora', () => {
        expect(normalizeTime('9:30')).toBe('09:30');
        expect(normalizeTime('09:30')).toBe('09:30');
        expect(normalizeTime('25:00')).toBeNull();
        expect(normalizeTime('19:75')).toBeNull();
        expect(normalizeTime('19')).toBeNull();
    });

    it('una hora escrita a medias no se guarda como recordatorio mudo', () => {
        expect(toNoteInput({ ...base, remindTime: '19:' })).toEqual({ error: 'reminder' });
    });

    it('un recordatorio encendido sin día tampoco', () => {
        expect(toNoteInput({ ...base, remindDate: null })).toEqual({ error: 'reminder' });
    });

    it('la hora corta se guarda con dos cifras', () => {
        expect(toNoteInput({ ...base, remindTime: '7:05' })).toMatchObject({
            remindAt: '2026-09-20T07:05:00',
        });
    });
});

/** Al editar, `undefined` es «no tocar»: lo que se quitó tiene que viajar como `null`. */
describe('toUpdateInput', () => {
    const input = { kind: 'seguimiento' as const, occurredAt: '2026-09-29', told: 'Algo' };

    it('quitar el recordatorio lo borra de verdad', () => {
        const update = toUpdateInput(input, { remindAt: '2026-10-01T19:30:00' });
        expect(update).toMatchObject({ remindAt: null, remindText: null, advice: null });
    });

    it('mover el recordatorio lo deja otra vez pendiente', () => {
        const update = toUpdateInput(
            { ...input, remindAt: '2026-10-05T08:00:00' },
            { remindAt: '2026-10-01T19:30:00' },
        );
        expect(update.remindDone).toBe(false);
    });

    it('dejarlo como estaba no toca si estaba hecho', () => {
        const update = toUpdateInput(
            { ...input, remindAt: '2026-10-01T19:30:00' },
            { remindAt: '2026-10-01T19:30:00' },
        );
        expect(update).not.toHaveProperty('remindDone');
    });
});
