import { fireEvent, render, screen } from '@testing-library/react-native';
import { JournalCalendar } from './journal-calendar';
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

jest.mock('@/data/repos/journal-repo', () => ({ listJournal: jest.fn() }));
jest.mock('@/data/repos/dashboard-repo', () => ({ todayIso: () => '2026-10-04' }));
jest.mock('@/hooks/use-lists', () => ({
    useListContext: () => ({
        context: { churchId: 'north', userId: 'owner' },
        enabled: true,
        canManage: true,
    }),
}));
jest.mock('@tanstack/react-query', () => ({
    useQuery: () => ({
        data: [
            {
                id: 'one',
                title: 'Visita del domingo',
                kind: 'observacion',
                occurredAt: '2026-10-04',
                excerpt: 'Una conversación',
                hasAudio: false,
                hasLearned: false,
            },
            {
                id: 'two',
                title: 'Conversación del lunes',
                kind: 'observacion',
                occurredAt: '2026-10-05',
                excerpt: 'Otra conversación',
                hasAudio: false,
                hasLearned: false,
            },
        ],
    }),
}));

it('filtra las fichas del mes al elegir un día y vuelve a mostrar todas al desmarcarlo', async () => {
    await render(
        <JournalCalendar
            query={{}}
            selection={new Set()}
            selectionMode={false}
            onSelect={jest.fn()}
        />,
    );
    expect(screen.getByRole('button', { name: 'Conversación del lunes' })).toBeTruthy();
    const day = screen.getByRole('button', { name: '2026-10-04: 1 entradas' });
    await fireEvent.press(day);
    expect(screen.getByRole('button', { name: 'Visita del domingo' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Conversación del lunes' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: '2026-10-04: 1 entradas' }));
    expect(screen.getByRole('button', { name: 'Conversación del lunes' })).toBeTruthy();
});
