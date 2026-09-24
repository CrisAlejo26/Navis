import { render, screen } from '@testing-library/react-native';

import { NoteCard } from '@/components/believers/note-card';
import type { LocalNote } from '@/data/repos/notes-repo';

jest.mock('expo-audio', () => ({
    useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn() }),
}));

/** Una nota como la que devuelve el repo, con lo que la tarjeta pinta. */
function nota(overrides: Partial<LocalNote> = {}): LocalNote {
    return {
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
        ...overrides,
    };
}

const SIN_ACCIONES = { onToggleReminder: jest.fn(), onDeleteAudio: jest.fn() };

describe('NoteCard', () => {
    it('la pastilla dice el tipo — lo que antes se perdía entre notas iguales', async () => {
        await render(<NoteCard note={nota()} {...SIN_ACCIONES} />);

        expect(screen.getByText('Seguimiento')).toBeTruthy();
        expect(screen.getByText('10/09/2026')).toBeTruthy();
        expect(screen.getByText(/Contó que la familia/)).toBeTruthy();
        expect(screen.getByText(/Cristian/)).toBeTruthy();
    });

    it('el don va en la pastilla junto al tipo, y la indicación en su cajita', async () => {
        await render(
            <NoteCard
                note={nota({
                    kind: 'don',
                    giftName: 'Ofrenda',
                    advice: 'Anotar el don en el catálogo.',
                })}
                {...SIN_ACCIONES}
            />,
        );

        expect(screen.getByText('Don')).toBeTruthy();
        expect(screen.getByText('· Ofrenda')).toBeTruthy();
        expect(screen.getByText('Anotar el don en el catálogo.')).toBeTruthy();
    });

    it('el recordatorio vivo avisa con su línea y su botón', async () => {
        await render(
            <NoteCard
                note={nota({
                    remindAt: '2026-09-20',
                    remindText: 'Llamar por teléfono',
                })}
                {...SIN_ACCIONES}
            />,
        );

        expect(screen.getByLabelText('Dar por hecho')).toBeTruthy();
    });
});
