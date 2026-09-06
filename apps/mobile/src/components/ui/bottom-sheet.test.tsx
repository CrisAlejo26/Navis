import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';

describe('BottomSheet', () => {
  it('cierra al pulsar el fondo', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose}>
        <Text>Contenido</Text>
      </BottomSheet>,
    );

    await fireEvent.press(screen.getByLabelText('Cerrar'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cierra al pulsar el botón de la cabecera, con título', async () => {
    const onClose = jest.fn();
    await render(
      <BottomSheet visible onClose={onClose} title="Filtros">
        <Text>Contenido</Text>
      </BottomSheet>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
