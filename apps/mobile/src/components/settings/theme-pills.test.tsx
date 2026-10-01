import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemePills } from '@/components/settings/theme-pills';
import { useThemeStore } from '@/lib/theme';

describe('ThemePills', () => {
    beforeEach(() => {
        useThemeStore.getState().setMode('system');
    });

    afterEach(() => {
        useThemeStore.getState().setMode('system');
    });

    it('anuncia únicamente el modo actual como seleccionado', async () => {
        await render(<ThemePills />);

        expect(screen.getByRole('radio', { name: 'Sistema', selected: true })).toBeTruthy();
        expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(1);
    });

    it('cambia entre oscuro, claro y sistema y actualiza la selección accesible', async () => {
        await render(<ThemePills />);

        for (const [name, mode] of [
            ['Oscuro', 'dark'],
            ['Claro', 'light'],
            ['Sistema', 'system'],
        ] as const) {
            await fireEvent.press(screen.getByRole('radio', { name }));

            expect(useThemeStore.getState().mode).toBe(mode);
            if (mode !== 'system') {
                expect(useThemeStore.getState().resolvedTheme).toBe(mode);
            }
            expect(screen.getByRole('radio', { name, selected: true })).toBeTruthy();
            expect(screen.getAllByRole('radio', { selected: true })).toHaveLength(1);
        }
    });
});
