import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskDirectoryEmpty } from './directory-empty';
import type { TaskDirectoryState } from './use-task-directory';
import { defaultFilters } from '@/lib/tasks/filters';
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

function state(exists: boolean, error = false): TaskDirectoryState {
    return {
        listing: { isPending: false, isError: error, refetch: jest.fn() },
        exists: { isPending: false, isError: false, data: exists, refetch: jest.fn() },
        setFilters: jest.fn(),
        setView: jest.fn(),
    } as unknown as TaskDirectoryState;
}
describe('estados vacíos de la agenda', () => {
    it('distingue una agenda nueva de una búsqueda sin coincidencias', async () => {
        const rendered = await render(<TaskDirectoryEmpty state={state(false)} />);
        expect(screen.getByText('Todavía no hay tareas ni hábitos')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Restablecer' })).toBeNull();
        const filtered = state(true);
        await rendered.rerender(<TaskDirectoryEmpty state={filtered} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Restablecer' }));
        expect(filtered.setFilters).toHaveBeenCalledWith(defaultFilters());
        expect(filtered.setView).toHaveBeenCalledWith('list');
    });
    it('el error permite volver a consultar datos y existencia', async () => {
        const failed = state(false, true);
        await render(<TaskDirectoryEmpty state={failed} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
        expect(failed.listing.refetch).toHaveBeenCalled();
        expect(failed.exists.refetch).toHaveBeenCalled();
    });
});
