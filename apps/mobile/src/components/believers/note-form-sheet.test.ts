import { emptyNoteForm, toNoteInput } from '@/components/believers/note-form-values';

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
