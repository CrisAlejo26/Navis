import { Alert } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { RunningTimer, TaskTime, TaskTimeSummary as Summary } from '@navis/shared';
import { RunningTimerBar } from './running-timer-bar';
import { TaskTimeSummary } from './task-time-summary';
import { TaskTimerControl } from './task-timer-control';

const TASK = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';
const NOW = new Date('2026-10-08T10:00:00.000Z');

interface MockState {
    running: RunningTimer | null;
    time: TaskTime;
    summary: Summary | undefined;
}
const mockState: MockState = {
    running: null,
    time: { entries: [], totalSeconds: 0 },
    summary: undefined,
};
const mockStart = jest.fn();
const mockStop = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/hooks/use-task-time', () => ({
    useRunningTimer: () => ({ data: mockState.running }),
    useTaskTime: () => ({ data: mockState.time }),
    useTimeSummary: () => ({ data: mockState.summary }),
    useStartTimer: () => ({ mutate: mockStart, isPending: false }),
    useStopTimer: () => ({ mutate: mockStop, isPending: false }),
    useDeleteTimeEntry: () => ({ mutate: mockRemove, isPending: false }),
}));
jest.mock('expo-router', () => ({
    router: { replace: jest.fn(), back: jest.fn(), push: jest.fn() },
    useRouter: () => ({ back: jest.fn() }),
}));

const running = (taskId: string, secondsAgo: number): RunningTimer => ({
    entry: {
        id: '00000000-0000-4000-8000-0000000000e1',
        taskId,
        startedAt: new Date(NOW.getTime() - secondsAgo * 1000).toISOString(),
        endedAt: null,
    },
    task: { id: taskId, title: 'Preparar sermón' },
});

describe('cronómetro de tareas en el móvil', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: NOW });
        jest.clearAllMocks();
        mockState.running = null;
        mockState.time = { entries: [], totalSeconds: 0 };
        mockState.summary = undefined;
    });
    afterEach(() => {
        jest.useRealTimers();
    });

    describe('la barra de «en marcha»', () => {
        it('no pinta nada si no hay cronómetro', async () => {
            await render(<RunningTimerBar />);
            expect(screen.queryByText('Preparar sermón')).toBeNull();
        });

        it('enseña la tarea y un reloj que avanza solo', async () => {
            mockState.running = running(TASK, 65);
            await render(<RunningTimerBar />);
            expect(screen.getByText('Preparar sermón')).toBeTruthy();
            expect(screen.getByText('01:05')).toBeTruthy();
            await act(() => {
                jest.advanceTimersByTime(3000);
                return Promise.resolve();
            });
            expect(screen.getByText('01:08')).toBeTruthy();
        });

        it('parar detiene el cronómetro y tocar la tarea la abre', async () => {
            mockState.running = running(TASK, 5);
            await render(<RunningTimerBar />);
            await fireEvent.press(screen.getByRole('button', { name: 'Parar' }));
            expect(mockStop).toHaveBeenCalledTimes(1);
            await fireEvent.press(screen.getByRole('button', { name: 'Preparar sermón' }));
            expect(router.push).toHaveBeenCalledWith({
                pathname: '/tasks/detail',
                params: { kind: 'task', id: TASK },
            });
        });
    });

    describe('el control de una tarea', () => {
        it('sin tiempo registrado invita a empezar', async () => {
            await render(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('Aún sin tiempo registrado')).toBeTruthy();
            await fireEvent.press(screen.getByRole('button', { name: 'Empezar' }));
            expect(mockStart).toHaveBeenCalledWith(TASK);
        });

        it('enseña el total de lo cerrado', async () => {
            mockState.time = { entries: [], totalSeconds: 3900 };
            await render(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('Total: 1h 5m')).toBeTruthy();
        });

        it('con esta tarea en marcha ofrece parar y enseña el reloj', async () => {
            mockState.running = running(TASK, 125);
            await render(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('02:05')).toBeTruthy();
            await fireEvent.press(screen.getByRole('button', { name: 'Parar' }));
            expect(mockStop).toHaveBeenCalledTimes(1);
            expect(screen.queryByRole('button', { name: 'Empezar' })).toBeNull();
        });

        it('si corre el de otra tarea, empezar esta sigue siendo posible', async () => {
            mockState.running = running(OTHER, 30);
            await render(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByRole('button', { name: 'Empezar' })).toBeTruthy();
            expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull();
        });

        it('borrar una entrada pide confirmación', async () => {
            const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
            mockState.time = {
                totalSeconds: 600,
                entries: [
                    {
                        id: '00000000-0000-4000-8000-0000000000e2',
                        taskId: TASK,
                        startedAt: '2026-10-08T09:00:00.000Z',
                        endedAt: '2026-10-08T09:10:00.000Z',
                    },
                ],
            };
            await render(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('10:00')).toBeTruthy();
            await fireEvent.press(screen.getByRole('button', { name: 'Borrar esta entrada' }));
            expect(alert).toHaveBeenCalled();
            expect(mockRemove).not.toHaveBeenCalled();
        });
    });

    describe('el resumen de tiempo', () => {
        it('sin datos no pinta nada, y sin tiempo lo dice', async () => {
            await render(<TaskTimeSummary from="2026-10-05" to="2026-10-11" />);
            expect(screen.queryByText('Tiempo trabajado')).toBeNull();
        });

        it('sin tiempo en el periodo lo dice con palabras', async () => {
            mockState.summary = {
                from: '2026-10-05',
                to: '2026-10-11',
                totalSeconds: 0,
                byTask: [],
                byWorkflow: [],
            };
            await render(<TaskTimeSummary from="2026-10-05" to="2026-10-11" />);
            expect(screen.getByText('Sin tiempo registrado en este periodo')).toBeTruthy();
        });

        it('enseña el total, los flujos y las tareas con su duración escrita', async () => {
            mockState.summary = {
                from: '2026-10-05',
                to: '2026-10-11',
                totalSeconds: 6000,
                byTask: [
                    { taskId: TASK, title: 'Sermón', seconds: 5400 },
                    { taskId: OTHER, title: 'Llamadas', seconds: 600 },
                ],
                byWorkflow: [
                    {
                        workflowId: '00000000-0000-4000-8000-0000000000f1',
                        name: 'Visitas',
                        accent: '#2140cf',
                        seconds: 5400,
                    },
                    { workflowId: null, name: null, accent: null, seconds: 600 },
                ],
            };
            await render(<TaskTimeSummary from="2026-10-05" to="2026-10-11" />);
            expect(screen.getByText('1h 40m')).toBeTruthy();
            expect(screen.getByText('Visitas')).toBeTruthy();
            expect(screen.getByText('Sin flujo')).toBeTruthy();
            expect(screen.getByText('Sermón')).toBeTruthy();
            // El flujo «Visitas» y la tarea «Sermón» suman lo mismo: salen dos veces.
            expect(screen.getAllByText('1h 30m')).toHaveLength(2);
        });
    });
});
