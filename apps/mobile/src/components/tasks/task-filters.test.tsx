import { render, screen, fireEvent } from '@testing-library/react-native';
import { TaskFiltersScreen } from './task-filters';
import { defaultFilters } from '@/lib/tasks/filters';
jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/hooks/use-tags', () => ({ useTaskTags: () => ({ data: [], isPending: false }) }));
jest.mock('@/hooks/use-activities', () => ({
    useActivities: () => ({ data: { pages: [{ total: 3 }] }, isPending: false, isError: false }),
}));
describe('filtros con borrador', () => {
    it('no modifica la agenda hasta aplicar y conserva el tipo seleccionado', async () => {
        const apply = jest.fn(),
            close = jest.fn();
        await render(
            <TaskFiltersScreen
                filters={defaultFilters()}
                today="2026-10-05"
                timezone="Europe/Madrid"
                onApply={apply}
                onClose={close}
            />,
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Hábitos' }));
        expect(apply).not.toHaveBeenCalled();
        await fireEvent.press(screen.getByRole('button', { name: 'Aplicar (3)' }));
        expect(apply).toHaveBeenCalledWith(expect.objectContaining({ type: 'habit' }));
    });
    it('volver descarta el borrador y marcar hechas desactiva ocultar completadas', async () => {
        const apply = jest.fn(),
            close = jest.fn();
        await render(
            <TaskFiltersScreen
                filters={defaultFilters()}
                today="2026-10-05"
                timezone="Europe/Madrid"
                onApply={apply}
                onClose={close}
            />,
        );
        await fireEvent.press(screen.getByRole('button', { name: 'Completada' }));
        expect(
            screen.getByRole('switch', { name: 'Ocultar completadas' }).props.accessibilityState,
        ).toMatchObject({
            checked: false,
        });
        await fireEvent.press(screen.getByRole('button', { name: 'Volver' }));
        expect(close).toHaveBeenCalled();
        expect(apply).not.toHaveBeenCalled();
    });
});
