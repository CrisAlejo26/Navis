import { fireEvent, render, screen } from '@testing-library/react-native';

import { ListRow } from '@/components/ui/list-row';

describe('ListRow', () => {
  it('llama a onPress al pulsar', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Registro" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Registro' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no llama a onPress si está deshabilitado', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Registro" onPress={onPress} disabled />);

    await fireEvent.press(screen.getByRole('button', { name: 'Registro' }));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('anuncia la etiqueta de accesibilidad si se pasa, en vez del título', async () => {
    await render(
      <ListRow title="Registro" onPress={jest.fn()} accessibilityLabel="Abrir registro" />,
    );

    expect(screen.getByRole('button', { name: 'Abrir registro' })).toBeTruthy();
  });

  it('sin onPress es una fila estática, no un botón', async () => {
    await render(<ListRow title="Registro" />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Registro')).toBeTruthy();
  });

  it('muestra título y subtítulo', async () => {
    await render(<ListRow title="Registro" subtitle="Hace 2 días" />);

    expect(screen.getByText('Registro')).toBeTruthy();
    expect(screen.getByText('Hace 2 días')).toBeTruthy();
  });
});
