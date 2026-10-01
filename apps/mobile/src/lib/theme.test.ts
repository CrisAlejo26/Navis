import { Appearance } from 'react-native';
import { colorScheme } from 'react-native-css';

import { useThemeStore } from './theme';

jest.mock('react-native-css', () => ({ colorScheme: { set: jest.fn() } }));

describe('tema móvil', () => {
    it('actualiza CSS sin esperar el evento asíncrono de Appearance', () => {
        const native = jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => undefined);
        for (const mode of ['dark', 'light', 'system'] as const) {
            jest.mocked(colorScheme.set).mockClear();
            useThemeStore.getState().setMode(mode);
            expect(colorScheme.set).toHaveBeenCalledWith(useThemeStore.getState().resolvedTheme);
            expect(native).toHaveBeenLastCalledWith(mode === 'system' ? 'unspecified' : mode);
        }
        native.mockRestore();
    });
});
