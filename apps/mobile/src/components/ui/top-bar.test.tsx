import { fireEvent, render, screen } from '@testing-library/react-native';

import { TopBar } from '@/components/ui/top-bar';

describe('TopBar', () => {
  it('pinta el título como encabezado, y el subtítulo si se pasa', async () => {
    await render(<TopBar title="Más" subtitle="Todos los apartados" />);

    expect(screen.getByRole('header', { name: 'Más' })).toBeTruthy();
    expect(screen.getByText('Todos los apartados')).toBeTruthy();
  });

  it('llama a onPress de la acción al pulsarla', async () => {
    const onPress = jest.fn();
    await render(<TopBar title="Notas" action={{ icon: 'add', label: 'Añadir nota', onPress }} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Añadir nota' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
