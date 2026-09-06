import { render, screen } from '@testing-library/react-native';

import { TextField } from '@/components/ui/text-field';

describe('TextField', () => {
  it('expone la etiqueta como accessibilityLabel del campo', async () => {
    await render(<TextField label="Correo electrónico" />);

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
  });

  it('oculta la etiqueta visible con hideLabel, pero la conserva como accesible', async () => {
    await render(<TextField label="Buscar" hideLabel />);

    expect(screen.queryByText('Buscar')).toBeNull();
    expect(screen.getByLabelText('Buscar')).toBeTruthy();
  });

  it('muestra el mensaje de error cuando se pasa', async () => {
    await render(<TextField label="Correo electrónico" error="El correo no es válido" />);

    expect(screen.getByText('El correo no es válido')).toBeTruthy();
  });
});
