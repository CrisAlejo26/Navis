import { fireEvent, render, screen } from '@testing-library/react-native';
import type { DreamsStats } from '@navis/shared';

import { DreamStatCards } from '@/components/dreams/dream-stat-cards';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    __esModule: true,
    router: {
        push: (...args: unknown[]): void => {
            mockPush(...args);
        },
    },
}));

const STATS: DreamsStats = {
    total: 12,
    thisMonth: 4,
    thisWeek: 2,
    fulfilled: 3,
    nights: [],
    weeks: [{ weekStart: '2026-08-03', count: 2 }],
    monthly: [{ month: '2026-08', count: 4 }],
    byWeekday: [],
    byEmotion: [],
    streak: 5,
    lastFulfilled: { id: 'sueno-1', title: null, fulfilledAt: '2026-08-01' },
};

describe('las tarjetas de la portada de sueños (D16: la métrica es la navegación)', () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it('«Cumplidos» abre el listado filtrado por ese estado', async () => {
        await render(<DreamStatCards stats={STATS} />);
        await fireEvent.press(screen.getByText('Cumplidos'));

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/dreams/list',
            params: { state: 'cumplido' },
        });
    });

    it('«Esta semana» abre el listado desde el lunes de esta semana', async () => {
        await render(<DreamStatCards stats={STATS} />);
        await fireEvent.press(screen.getByText('Esta semana'));

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/dreams/list',
            params: { from: '2026-08-03' },
        });
    });

    it('«El último cumplido» lleva a la ficha de ese sueño', async () => {
        await render(<DreamStatCards stats={STATS} />);
        await fireEvent.press(screen.getByText('El último cumplido'));

        expect(mockPush).toHaveBeenCalledWith('/dreams/sueno-1');
    });

    it('la racha es una cuenta, no un filtro: tocarla no navega', async () => {
        await render(<DreamStatCards stats={STATS} />);
        await fireEvent.press(screen.getByText('Racha'));

        expect(mockPush).not.toHaveBeenCalled();
    });
});
