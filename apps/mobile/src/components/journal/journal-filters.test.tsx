import { fireEvent, render, screen } from '@testing-library/react-native';
import { JournalFilters } from './journal-filters';
import { useJournal } from '@/hooks/use-journal';
jest.mock('@/hooks/use-journal', () => ({
    useJournal: jest.fn(() => ({
        data: { pages: [{ total: 3 }] },
        isPending: false,
        isError: false,
    })),
}));
it('conserva un borrador y aplica todos los filtros solo al confirmar', async () => {
    const change = jest.fn(),
        close = jest.fn();
    await render(
        <JournalFilters query={{}} search="esperanza" onChange={change} onClose={close} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Oración' }));
    expect(change).not.toHaveBeenCalled();
    expect(useJournal).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: ['oracion'], search: 'esperanza', limit: 1 }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Aplicar (3)' }));
    expect(change).toHaveBeenCalledWith({ kind: ['oracion'] });
    expect(close).toHaveBeenCalledTimes(1);
});
it('cancelar no aplica el borrador ni el restablecimiento', async () => {
    const change = jest.fn(),
        close = jest.fn();
    await render(
        <JournalFilters query={{ kind: ['decision'] }} onChange={change} onClose={close} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Quitar los filtros' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));
    expect(change).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledTimes(1);
});
