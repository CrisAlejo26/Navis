import { render, screen, fireEvent } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type * as ReactNative from 'react-native';
import { ActivityEditor } from './activity-editor';
const mockMutate = jest.fn();
jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
}));
jest.mock('@/hooks/use-lists', () => ({
    useListContext: () => ({ church: { timezone: 'Europe/Madrid' } }),
}));
jest.mock('@/hooks/use-tasks', () => ({
    useTaskMutation: () => ({ mutateAsync: mockMutate, isPending: false }),
}));
jest.mock('@/hooks/use-workflows', () => ({
    useWorkflows: () => ({ data: [], isPending: false }),
}));
jest.mock('@/hooks/use-tags', () => ({
    useTaskTags: () => ({ data: [], isPending: false, isError: false }),
}));
jest.mock('@/components/tables/row-editor-frame', () => {
    const { View } = jest.requireActual<typeof ReactNative>('react-native');
    return {
        RowEditorFrame: ({ children, footer }: { children: ReactNode; footer: ReactNode }) => (
            <View>
                {children}
                {footer}
            </View>
        ),
    };
});
describe('editor de actividades', () => {
    beforeEach(() => {
        mockMutate.mockReset();
        mockMutate.mockResolvedValue('id-nuevo');
    });
    it('no guarda un título vacío; señala el campo que falta', async () => {
        await render(<ActivityEditor kind="task" day="2026-10-05" />);
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        expect(mockMutate).not.toHaveBeenCalled();
        expect(screen.getByText('Escribe un título.')).toBeTruthy();
    });
    it('permite crear un hábito con meta y descarta el estado exclusivo de tareas', async () => {
        await render(<ActivityEditor kind="task" day="2026-10-05" />);
        await fireEvent.press(screen.getByRole('button', { name: 'Hábitos' }));
        expect(screen.queryByRole('button', { name: 'En progreso' })).toBeNull();
        await fireEvent.changeText(screen.getByLabelText('Título'), 'Leer el pasaje');
        await fireEvent.changeText(screen.getByLabelText('Meta'), 'Un capítulo');
        await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
        expect(mockMutate).toHaveBeenCalledWith(
            expect.objectContaining({
                kind: 'habit',
                input: expect.objectContaining({
                    title: 'Leer el pasaje',
                    goal: 'Un capítulo',
                    repeatFreq: 'diaria',
                }),
            }),
        );
    });
});
