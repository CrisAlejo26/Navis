import { fireEvent, render, screen } from '@testing-library/react-native';

import { NoteDetailSheet } from '@/components/believers/note-detail-sheet';
import type { LocalNote } from '@/data/repos/notes-repo';

jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
}));

const NOTA: LocalNote = {
    id: '11111111-1111-1111-1111-111111111111',
    churchId: '22222222-2222-2222-2222-222222222222',
    believerId: '33333333-3333-3333-3333-333333333333',
    kind: 'seguimiento',
    occurredAt: '2026-09-10',
    told: 'Contó que la familia le acompaña a los cultos.',
    advice: null,
    giftId: null,
    giftName: null,
    remindAt: null,
    remindText: null,
    remindDoneAt: null,
    audios: [],
    authorId: null,
    authorName: 'Cristian',
    createdAt: '2026-09-10T10:00:00Z',
};

const ACCIONES = { onClose: jest.fn(), onToggleReminder: jest.fn(), onDeleteAudio: jest.fn() };

describe('NoteDetailSheet', () => {
    it('enseña la nota para leerla, sin abrir la edición por su cuenta', async () => {
        const onEdit = jest.fn();
        await render(<NoteDetailSheet note={NOTA} onEdit={onEdit} {...ACCIONES} />);

        expect(screen.getByText(/Contó que la familia/)).toBeTruthy();
        expect(onEdit).not.toHaveBeenCalled();
    });

    it('«Editar» es el paso explícito que lleva al formulario', async () => {
        const onEdit = jest.fn();
        await render(<NoteDetailSheet note={NOTA} onEdit={onEdit} {...ACCIONES} />);

        await fireEvent.press(screen.getByText('Editar'));

        expect(onEdit).toHaveBeenCalledWith(NOTA);
    });

    it('sin nota no pinta nada', async () => {
        await render(<NoteDetailSheet note={null} onEdit={jest.fn()} {...ACCIONES} />);

        expect(screen.queryByText('Editar')).toBeNull();
    });
});
