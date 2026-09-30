import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsRow } from '@/components/settings/settings-row';

describe('SettingsRow', () => {
    it('muestra el valor y abre su pantalla al pulsarla', async () => {
        const onPress = jest.fn();
        await render(
            <SettingsRow
                icon="language-outline"
                title="Idioma"
                value="Español"
                onPress={onPress}
            />,
        );

        expect(screen.getByText('Español')).toBeTruthy();
        await fireEvent.press(screen.getByRole('button', { name: 'Idioma' }));

        expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('es solo informativa, sin botón, cuando no se le da qué hacer', async () => {
        await render(<SettingsRow icon="phone-portrait-outline" title="Conexión" />);

        expect(screen.getByText('Conexión')).toBeTruthy();
        expect(screen.queryByRole('button')).toBeNull();
    });

    it('no se puede pulsar cuando está deshabilitada', async () => {
        const onPress = jest.fn();
        await render(
            <SettingsRow icon="leaf-outline" title="Sembrar" onPress={onPress} disabled />,
        );

        await fireEvent.press(screen.getByRole('button', { name: 'Sembrar' }));

        expect(onPress).not.toHaveBeenCalled();
    });
});
