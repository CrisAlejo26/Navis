import '@/data/test-support';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { tasksFixture } from '@/data/repos/tasks-test-support';
import {
    listJournal,
    findJournalEntry,
    updateJournalEntry,
    type JournalContext,
} from '@/data/repos/journal-repo';
import { JournalDirectory } from './journal-directory';
import { JournalDetail } from './journal-detail';
let mockContext: JournalContext;
jest.mock('@/components/believers/audio-recorder', () => ({ AudioRecorder: () => null }));
jest.mock('./journal-audio', () => ({ JournalAudio: () => null }));
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('expo-router', () => ({
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useLocalSearchParams: () => ({}),
}));
jest.mock('@/hooks/use-lists', () => ({
    useListContext: () => ({ context: mockContext, enabled: true, canManage: true }),
}));
jest.mock('@/hooks/use-debounced-value', () => ({ useDebouncedValue: (value: string) => value }));
jest.mock('@/lib/notifications/sync', () => ({ syncNotifications: () => Promise.resolve() }));
jest.mock('@/hooks/use-reminder-prompt', () => ({
    useAfterReminderSaved: () => () => Promise.resolve(),
}));
jest.mock('react-native-gifted-charts', () => ({ BarChart: () => null }));
jest.mock('./journal-detail-audios', () => ({ JournalDetailAudios: () => null }));
jest.mock('@/hooks/use-journal-share', () => ({
    useJournalShare: () => ({ sharing: false, share: jest.fn() }),
}));

describe('crear → listado → editar → buscar → atender → borrar, con SQLite real', () => {
    const { contexts: c } = tasksFixture();
    it('recorre los componentes y conserva los datos completos y el ámbito al navegar', async () => {
        mockContext = c.north;
        const client = new QueryClient({
            defaultOptions: {
                queries: { retry: false, gcTime: Infinity },
                mutations: { gcTime: Infinity },
            },
        });
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={client}>{children}</QueryClientProvider>
        );
        const listing = await render(<JournalDirectory list />, { wrapper });
        await fireEvent.press(screen.getByRole('button', { name: 'Añadir entrada' }));
        await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita de contrato');
        await fireEvent.changeText(
            screen.getByLabelText('Anotación'),
            'Una conversación íntegra '.repeat(20),
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Visita de contrato' })).toBeTruthy(),
        );
        const id = (await listJournal(c.north, {})).items[0].id;
        expect((await listJournal(c.south, {})).total).toBe(0);
        await fireEvent.press(screen.getByRole('button', { name: 'Visita de contrato' }));
        expect(router.push).toHaveBeenCalledWith({ pathname: '/journal/[id]', params: { id } });
        await listing.unmount();
        await updateJournalEntry(c.north, id, { remindAt: '2099-10-08T19:00:00Z' });
        const detail = await render(<JournalDetail id={id} />, { wrapper });
        await waitFor(() => expect(screen.getByText('Visita de contrato')).toBeTruthy());
        await fireEvent.press(screen.getByRole('button', { name: 'Editar la entrada' }));
        await fireEvent.changeText(screen.getByLabelText('Título'), 'Visita editada');
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        await waitFor(() => expect(screen.getByText('Visita editada')).toBeTruthy());
        expect((await findJournalEntry(c.north, id))?.annotation).toBe(
            'Una conversación íntegra '.repeat(20).trim(),
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Dar por atendido' }));
        await waitFor(() => expect(screen.getByText('Atendido')).toBeTruthy());
        expect((await listJournal(c.north, { pendingReminder: true })).total).toBe(0);
        await detail.unmount();
        const search = await render(<JournalDirectory list />, { wrapper });
        await fireEvent.changeText(screen.getByPlaceholderText('Buscar en el cuaderno'), 'EDITADA');
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Visita editada' })).toBeTruthy(),
        );
        await search.unmount();
        const last = await render(<JournalDetail id={id} />, { wrapper });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Eliminar' })).toBeTruthy());
        await fireEvent.press(screen.getByRole('button', { name: 'Eliminar' }));
        await fireEvent.press(screen.getAllByRole('button', { name: 'Eliminar' }).at(-1)!);
        await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/journal/list'));
        expect(await findJournalEntry(c.north, id)).toBeNull();
        await last.unmount();
        client.clear();
    });
});
