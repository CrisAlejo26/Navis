import { act, fireEvent, screen } from '@testing-library/react';
import type * as ApiClient from '@navis/api-client';
import type { RunningTimer, TaskTime } from '@navis/shared';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { RunningTimerBar } from '@/components/tasks/running-timer-bar';
import { TaskTimerControl } from '@/components/tasks/task-timer-control';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const TASK = '00000000-0000-4000-8000-000000000001';
const OTHER = '00000000-0000-4000-8000-000000000002';

interface TimerState {
    running: RunningTimer | null;
    time: TaskTime;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
}

const state = vi.hoisted<TimerState>(() => ({
    running: null,
    time: { entries: [], totalSeconds: 0 },
    start: vi.fn(() => Promise.resolve({})),
    stop: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve()),
}));

vi.mock('@navis/api-client', async (importOriginal) => ({
    ...(await importOriginal<typeof ApiClient>()),
    useRunningTimer: () => ({ data: state.running }),
    useTaskTime: () => ({ data: state.time }),
    useStartTimer: () => ({ mutateAsync: state.start, isPending: false }),
    useStopTimer: () => ({ mutateAsync: state.stop, isPending: false }),
    useDeleteTimeEntry: () => ({ mutateAsync: state.remove, isPending: false }),
}));
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const NOW = new Date('2026-10-08T10:00:00.000Z');
const running = (taskId: string, secondsAgo: number): RunningTimer => ({
    entry: {
        id: '00000000-0000-4000-8000-0000000000e1',
        taskId,
        startedAt: new Date(NOW.getTime() - secondsAgo * 1000).toISOString(),
        endedAt: null,
    },
    task: { id: taskId, title: 'Preparar sermón' },
});

describe('cronómetro de tareas', () => {
    beforeAll(async () => {
        await i18n.changeLanguage('es');
    });
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        state.running = null;
        state.time = { entries: [], totalSeconds: 0 };
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    describe('la barra de «en marcha»', () => {
        it('no pinta nada si no hay cronómetro', () => {
            renderWithI18n(<RunningTimerBar />);
            expect(screen.queryByRole('status')).toBeNull();
        });

        it('enseña la tarea y un reloj que avanza solo', () => {
            state.running = running(TASK, 65);
            renderWithI18n(<RunningTimerBar />);
            expect(screen.getByText('Preparar sermón')).toBeTruthy();
            expect(screen.getByText('01:05')).toBeTruthy();
            act(() => {
                vi.advanceTimersByTime(3000);
            });
            expect(screen.getByText('01:08')).toBeTruthy();
        });

        it('parar detiene el cronómetro', () => {
            state.running = running(TASK, 5);
            renderWithI18n(<RunningTimerBar />);
            fireEvent.click(screen.getByRole('button', { name: 'Parar' }));
            expect(state.stop).toHaveBeenCalledTimes(1);
        });
    });

    describe('el control de una tarea', () => {
        it('sin tiempo registrado invita a empezar', () => {
            renderWithI18n(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('Aún sin tiempo registrado')).toBeTruthy();
            fireEvent.click(screen.getByRole('button', { name: 'Empezar' }));
            expect(state.start).toHaveBeenCalledWith(TASK);
        });

        it('enseña el total de lo ya cerrado', () => {
            state.time = { entries: [], totalSeconds: 3900 };
            renderWithI18n(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('Total: 1h 5m')).toBeTruthy();
        });

        it('con el cronómetro de esta tarea en marcha ofrece parar y enseña el reloj', () => {
            state.running = running(TASK, 125);
            renderWithI18n(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy();
            expect(screen.queryByRole('button', { name: 'Empezar' })).toBeNull();
            expect(screen.getByText('02:05')).toBeTruthy();
        });

        it('si corre el de otra tarea, empezar esta sigue siendo posible', () => {
            state.running = running(OTHER, 30);
            renderWithI18n(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByRole('button', { name: 'Empezar' })).toBeTruthy();
            expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull();
        });

        it('lista las entradas cerradas y deja borrar una', () => {
            state.time = {
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
            renderWithI18n(<TaskTimerControl taskId={TASK} />);
            expect(screen.getByText('10:00')).toBeTruthy();
            fireEvent.click(screen.getByRole('button', { name: 'Borrar esta entrada' }));
            expect(state.remove).toHaveBeenCalledWith('00000000-0000-4000-8000-0000000000e2');
        });
    });
});
