import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { PreferencesGroup } from '@/components/settings/preferences-group';
import { SignOutButton } from '@/components/settings/sign-out-button';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('ajustes: grupos del concentrador', () => {
    it('abre la hoja de idiomas al pulsar la fila de idioma', async () => {
        await render(<PreferencesGroup />);
        expect(screen.queryByText('Français')).toBeNull();

        await fireEvent.press(screen.getByRole('button', { name: 'Idioma' }));

        expect(await screen.findByText('Français')).toBeTruthy();
    });

    it('pide confirmación antes de cerrar la sesión', async () => {
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        const onConfirm = jest.fn();
        await render(<SignOutButton onConfirm={onConfirm} />);

        await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión' }));

        expect(onConfirm).not.toHaveBeenCalled();
        const buttons = alert.mock.calls[0]?.[2] ?? [];
        buttons.find((b) => b.style === 'destructive')?.onPress?.();
        expect(onConfirm).toHaveBeenCalledTimes(1);
        alert.mockRestore();
    });
});
