import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as SplashScreen from 'expo-splash-screen';
// El prefijo `mock` es lo que deja a `jest.mock` usar una variable de fuera.
import { View as MockView } from 'react-native';

import { BootSplash } from '@/components/splash/boot-splash';

jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn(() => Promise.resolve()) }));

// El barco y el mar no pintan nada comprobable: aquí importa el ciclo de vida.
jest.mock('@/components/splash/sailing-boat', () => {
    return { SPLASH_BOAT_SIZE: 200, SailingBoat: () => <MockView testID="barco" /> };
});
jest.mock('@/components/auth/chart-lines', () => {
    return { ChartLines: () => <MockView testID="mar" /> };
});

// El overlay se oculta a la accesibilidad a propósito: es decorativo.
const HIDDEN = { includeHiddenElements: true };

describe('BootSplash', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.mocked(SplashScreen.hideAsync).mockClear();
    });
    afterEach(() => jest.useRealTimers());

    it('oculta el splash nativo cuando el suyo ya está maquetado, no antes', async () => {
        await render(<BootSplash />);
        expect(SplashScreen.hideAsync).not.toHaveBeenCalled();

        await fireEvent(screen.getByTestId('barco', HIDDEN), 'layout');

        expect(SplashScreen.hideAsync).toHaveBeenCalledTimes(1);
    });

    it('pinta el barco y el mar, y se retira solo cuando acaba la travesía', async () => {
        await render(<BootSplash />);
        expect(screen.getByTestId('barco', HIDDEN)).toBeTruthy();
        expect(screen.getByTestId('mar', HIDDEN)).toBeTruthy();

        await act(() => {
            // La travesía dura 1900 ms y el fundido añade 350 ms.
            jest.advanceTimersByTime(2250);
        });

        expect(screen.queryByTestId('barco', HIDDEN)).toBeNull();
    });
});
