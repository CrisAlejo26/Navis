import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('llama a onPress al pulsar', async () => {
    const onPress = jest.fn();
    await render(<Button title="Guardar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no llama a onPress si está deshabilitado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Guardar" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('no llama a onPress mientras carga, y lo anuncia como ocupado', async () => {
    const onPress = jest.fn();
    await render(<Button title="Guardar" onPress={onPress} loading />);

    const button = screen.getByRole('button', { name: 'Guardar', busy: true });
    await fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('el icono decorativo no tapa el nombre accesible del botón', async () => {
    await render(<Button title="Guardar" leadingIcon="checkmark" />);

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeTruthy();
  });
});
