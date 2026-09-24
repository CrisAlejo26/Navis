import { fireEvent, render, screen } from '@testing-library/react-native';
import type { PropheciesStats } from '@navis/shared';

import { ProphecyStatCards } from '@/components/prophecies/prophecy-stat-cards';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    push: (...args: unknown[]): void => {
      mockPush(...args);
    },
  },
}));

const STATS: PropheciesStats = {
  total: 10,
  byState: { espera: 4, camino: 3, cumplida: 3 },
  fulfilledThisYear: 2,
  receivedThisYear: 5,
  fulfillmentRate: 0.3,
  medianWaitingDays: 12,
  monthly: [],
  longestWaiting: null,
};

describe('las tarjetas-filtro de la portada', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('navegan al listado con el estado «espera» al tocar «En espera»', async () => {
    await render(<ProphecyStatCards stats={STATS} />);
    await fireEvent.press(screen.getByText('En espera'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/prophecies/list',
      params: { state: 'espera' },
    });
  });

  it('navegan con el estado «camino» al tocar «En camino»', async () => {
    await render(<ProphecyStatCards stats={STATS} />);
    await fireEvent.press(screen.getByText('En camino'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/prophecies/list',
      params: { state: 'camino' },
    });
  });

  it('la tarjeta «Todas» navega sin ningún filtro', async () => {
    await render(<ProphecyStatCards stats={STATS} />);
    await fireEvent.press(screen.getByText('Todas'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/prophecies/list', params: {} });
  });
});
