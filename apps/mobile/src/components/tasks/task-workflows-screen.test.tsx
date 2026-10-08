import { render, screen, fireEvent } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { WorkflowWithCount } from '@navis/shared';
import { TaskWorkflowBadge } from './task-workflow-badge';
import { TaskWorkflowsScreen } from './task-workflows-screen';

const mockState: { data: WorkflowWithCount[] | undefined; pending: boolean; error: boolean } = {
    data: [],
    pending: false,
    error: false,
};
jest.mock('@/hooks/use-workflows', () => ({
    useWorkflows: () => ({
        data: mockState.data,
        isPending: mockState.pending,
        isError: mockState.error,
        refetch: jest.fn(),
    }),
}));
jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
    useRouter: () => ({ back: jest.fn() }),
}));

const workflow = (name: string, count: number): WorkflowWithCount => ({
    id: `id-${name}`,
    name,
    description: null,
    accent: '#2140cf',
    position: 0,
    count,
});

describe('pantalla de flujos de trabajo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockState.data = [];
        mockState.pending = false;
        mockState.error = false;
    });

    it('sin flujos invita a crear el primero', async () => {
        await render(<TaskWorkflowsScreen />);
        expect(screen.getByText('Aún no hay flujos')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Nuevo flujo' }));
        expect(router.push).toHaveBeenCalledWith('/tasks/workflow-edit');
    });

    it('lista cada flujo con cuántas tareas lleva y lo abre para editarlo', async () => {
        mockState.data = [workflow('Predicación', 3), workflow('Visitas', 0)];
        await render(<TaskWorkflowsScreen />);
        expect(screen.getByText('Tareas: 3')).toBeTruthy();
        expect(screen.getByText('Tareas: 0')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Editar flujo Predicación' }));
        expect(router.push).toHaveBeenCalledWith({
            pathname: '/tasks/workflow-edit',
            params: { id: 'id-Predicación' },
        });
    });

    it('mientras carga no enseña la lista', async () => {
        mockState.data = undefined;
        mockState.pending = true;
        await render(<TaskWorkflowsScreen />);
        expect(screen.queryByText('Aún no hay flujos')).toBeNull();
    });
});

describe('chip del flujo', () => {
    it('dice el nombre del flujo, no solo el color', async () => {
        await render(<TaskWorkflowBadge workflow={{ name: 'Predicación', accent: '#2140cf' }} />);
        expect(screen.getByText('Predicación')).toBeTruthy();
    });
});
