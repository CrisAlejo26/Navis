import { fireEvent, render, screen } from '@testing-library/react-native';

import { PasswordField } from '@/components/ui/password-field';

describe('PasswordField', () => {
  it('empieza oculta y el botón alterna a mostrarla', async () => {
    await render(<PasswordField label="Contraseña" />);

    expect(screen.getByRole('button', { name: 'Mostrar la contraseña' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar la contraseña' }));

    expect(screen.getByRole('button', { name: 'Ocultar la contraseña' })).toBeTruthy();
  });
});
