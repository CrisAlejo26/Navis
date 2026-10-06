import { render, screen } from '@testing-library/react-native';
import { TaskHeader } from './task-header';
import { TaskTodayEmpty } from './task-today-empty';
import { defaultFilters } from '@/lib/tasks/filters';
import type { TaskTodayState } from './use-task-today';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/hooks/use-tags', () => ({ useTaskTags: () => ({ data: [], isPending: false }) }));

it('does not present zero totals while loading and keeps search available', async () => {
    const props = {
        filters: defaultFilters(),
        onChange: jest.fn(),
        view: 'list' as const,
        onView: jest.fn(),
        pending: 0,
        done: 0,
        total: 0,
        onFilters: jest.fn(),
    };
    const view = await render(<TaskHeader {...props} loading />);
    expect(screen.queryByText('0 pendientes · 0 hechas')).toBeNull();
    expect(screen.getByLabelText('Cargando…')).toBeTruthy();
    expect(screen.getByPlaceholderText('Buscar tareas y hábitos')).toBeTruthy();
    await view.rerender(<TaskHeader {...props} pending={4} done={2} total={6} />);
    expect(screen.getByText('4 pendientes · 2 hechas')).toBeTruthy();
    expect(screen.queryByLabelText('Cargando…')).toBeNull();
});

it('does not show an empty agenda or creation action until loading finishes', async () => {
    const state = {
        kind: 'habit',
        filter: 'all',
        listing: { isPending: true, isError: false },
    } as unknown as TaskTodayState;
    const view = await render(<TaskTodayEmpty state={state} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('tasks-loading').props.accessibilityState).toEqual({ busy: true });
    const loaded = {
        ...state,
        listing: { isPending: false, isError: false },
    } as unknown as TaskTodayState;
    await view.rerender(<TaskTodayEmpty state={loaded} />);
    expect(screen.queryByTestId('tasks-loading')).toBeNull();
    expect(screen.getByRole('button', { name: 'Nuevo hábito' })).toBeTruthy();
});
