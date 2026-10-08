import { render, screen, fireEvent } from '@testing-library/react-native';
import type { Task } from '@navis/shared';
import { TaskSeriesCard } from './task-series-card';

const series: Task = {
    id: '00000000-0000-4000-8000-000000000001',
    title: 'Reunión de obreros',
    description: null,
    date: '2026-10-05',
    time: null,
    priority: 'media',
    status: 'pendiente',
    completedAt: null,
    isRecurring: true,
    repeatFreq: 'semanal',
    repeatInterval: 1,
    repeatEndType: 'nunca',
    repeatEndDate: null,
    repeatEndCount: null,
    repeatOptions: { kind: 'weekdays', weekdays: [1, 4] },
    repeatPauses: [],
    repeatStoppedAt: null,
    tags: [],
    reminder: null,
};
const props = { today: '2026-10-08', busy: false, edit: jest.fn(), action: jest.fn() };

describe('tarjeta de serie', () => {
    beforeEach(() => jest.clearAllMocks());

    // Regresión: con intervalo 1 se leía «1 semanas».
    it('describe la repetición sin «1 semanas» y enseña la próxima fecha', async () => {
        await render(<TaskSeriesCard task={series} {...props} />);
        expect(screen.getByText(/Semanal · lun, jue|Semanal · lun\., jue\./i)).toBeTruthy();
        expect(screen.queryByText(/1 semanas/)).toBeNull();
        expect(screen.getByText('Activa')).toBeTruthy();
        expect(screen.getByText(/Próxima:/)).toBeTruthy();
    });

    it('con intervalo mayor que uno lo dice con «Cada»', async () => {
        await render(<TaskSeriesCard task={{ ...series, repeatInterval: 2 }} {...props} />);
        expect(screen.getByText(/Cada 2 semanas/)).toBeTruthy();
    });

    it('activa permite pausar o terminar, y editar al tocar el título', async () => {
        await render(<TaskSeriesCard task={series} {...props} />);
        await fireEvent.press(screen.getByRole('button', { name: 'Pausar' }));
        await fireEvent.press(screen.getByRole('button', { name: 'Terminar serie' }));
        await fireEvent.press(screen.getByRole('button', { name: /Reunión de obreros/ }));
        expect(props.action.mock.calls).toEqual([['pause'], ['finish']]);
        expect(props.edit).toHaveBeenCalledTimes(1);
    });

    it('pausada ofrece reanudar y no promete próximas tareas', async () => {
        const paused = { ...series, repeatPauses: [{ from: '2026-10-08', to: null }] };
        await render(<TaskSeriesCard task={paused} {...props} />);
        expect(screen.getByText('Pausada')).toBeTruthy();
        expect(screen.getByText('Sin próximas tareas')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Reanudar' }));
        expect(props.action).toHaveBeenCalledWith('resume');
    });

    it('terminada no ofrece ninguna acción', async () => {
        await render(
            <TaskSeriesCard task={{ ...series, repeatStoppedAt: '2026-10-07' }} {...props} />,
        );
        expect(screen.getByText('Terminada')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Terminar serie' })).toBeNull();
    });
});
