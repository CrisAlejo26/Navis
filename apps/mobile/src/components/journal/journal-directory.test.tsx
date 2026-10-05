import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { JournalDirectory } from './journal-directory';
import { useJournal } from '@/hooks/use-journal';
import { useListContext } from '@/hooks/use-lists';
import { shareJournalEntries } from '@/lib/journal/export';

jest.mock('expo-router', () => ({
    router: { push: jest.fn(), back: jest.fn() },
    useLocalSearchParams: () => ({}),
}));
jest.mock('@/hooks/use-journal', () => ({
    useJournal: jest.fn(),
    useJournalStats: () => ({ data: { total: 1, pendingReminders: 0 } }),
}));
jest.mock('@/hooks/use-lists', () => ({ useListContext: jest.fn() }));
jest.mock('@/hooks/use-debounced-value', () => ({ useDebouncedValue: (value: string) => value }));
jest.mock('@/lib/journal/export', () => ({
    shareJournalEntries: jest.fn(() => Promise.resolve()),
}));
jest.mock('./journal-form', () => ({ JournalForm: () => null }));
jest.mock('./journal-calendar', () => ({ JournalCalendar: () => null }));

const entry = {
    id: 'entry-1',
    title: 'Visita a la familia',
    kind: 'observacion',
    occurredAt: '2026-10-04',
    excerpt: 'Hablamos de esperanza.',
    hasLearned: true,
    hasAudio: false,
    remindAt: null,
    remindDoneAt: null,
    authorName: 'Cristian',
};
beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useListContext).mockReturnValue({
        context: { churchId: 'north', userId: 'owner' },
        enabled: true,
        canManage: true,
        church: undefined,
    });
    jest.mocked(useJournal).mockReturnValue({
        data: { pages: [{ items: [entry], total: 1 }], pageParams: [1] },
        isPending: false,
        isError: false,
        hasNextPage: false,
    } as unknown as ReturnType<typeof useJournal>);
});
it('abre la ficha sin entrar al formulario de edición', async () => {
    await render(<JournalDirectory list />);
    await fireEvent.press(screen.getByLabelText('Visita a la familia'));
    expect(router.push).toHaveBeenCalledWith({
        pathname: '/journal/[id]',
        params: { id: 'entry-1' },
    });
});
it('envía búsqueda y tipos combinados al repositorio', async () => {
    await render(<JournalDirectory list />);
    await fireEvent.changeText(screen.getByPlaceholderText('Buscar en el cuaderno'), 'esperanza');
    await fireEvent.press(screen.getByRole('button', { name: 'Oración' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Decisión' }));
    expect(useJournal).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'esperanza', kind: ['oracion', 'decision'] }),
    );
});
it('selecciona entradas y exporta por identificador, con la iglesia activa', async () => {
    await render(<JournalDirectory list />);
    expect(screen.queryByRole('checkbox')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Seleccionar' }));
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByRole('button', { name: 'Exportar a Markdown' }));
    expect(shareJournalEntries).toHaveBeenCalledWith(
        { churchId: 'north', userId: 'owner' },
        ['entry-1'],
        true,
    );
});
it('oculta creación y exportación a los miembros de solo lectura', async () => {
    jest.mocked(useListContext).mockReturnValue({
        context: { churchId: 'north', userId: 'reader' },
        enabled: true,
        canManage: false,
        church: undefined,
    });
    await render(<JournalDirectory list />);
    expect(screen.queryByRole('button', { name: 'Añadir entrada' })).toBeNull();
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Seleccionar' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Exportar a Markdown' })).toBeNull();
});

it('entra en selección con una pulsación larga y puede cancelarla', async () => {
    await render(<JournalDirectory list />);
    await fireEvent(screen.getByLabelText('Visita a la familia'), 'longPress');
    expect(screen.getByRole('checkbox').props.accessibilityState).toMatchObject({ checked: true });
    expect(router.push).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Exportar a Markdown' })).toBeNull();
});
