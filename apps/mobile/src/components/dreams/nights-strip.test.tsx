import { fireEvent, render, screen } from '@testing-library/react-native';
import type { DreamNight } from '@navis/shared';

import { NightsStrip } from '@/components/dreams/nights-strip';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
    __esModule: true,
    router: {
        push: (...args: unknown[]): void => {
            mockPush(...args);
        },
    },
}));

/** Doce semanas completas, como las trae la portada: 84 noches desde un lunes. */
const NIGHTS: DreamNight[] = Array.from({ length: 84 }, (_unused, index) => {
    const day = new Date(Date.UTC(2026, 4, 25 + index)).toISOString().slice(0, 10);
    return { day, count: index === 3 ? 2 : 0 };
});

describe('la franja de noches (D19)', () => {
    beforeEach(() => {
        mockPush.mockClear();
    });

    it('pinta una celda por noche, cada una con su etiqueta accesible', async () => {
        await render(<NightsStrip nights={NIGHTS} />);

        expect(screen.getAllByRole('button')).toHaveLength(84);
    });

    it('tocar una noche abre el listado de esa noche', async () => {
        await render(<NightsStrip nights={NIGHTS} />);
        await fireEvent.press(screen.getAllByRole('button')[3 * 12]);

        expect(mockPush).toHaveBeenCalledWith({
            pathname: '/dreams/list',
            params: { from: '2026-05-28', to: '2026-05-28' },
        });
    });
});
