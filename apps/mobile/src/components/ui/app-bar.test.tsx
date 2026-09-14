import { fireEvent, render, screen } from '@testing-library/react-native';

import { AppBar } from '@/components/ui/app-bar';

const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  __esModule: true,
  router: {
    back: (): void => {
      mockRouterBack();
    },
  },
}));

/** La barra de las pantallas apiladas: la flecha vuelve, el título se lee. */
describe('AppBar', () => {
  it('vuelve atrás al pulsar la flecha', async () => {
    await render(<AppBar title="Creyentes" />);
    await fireEvent.press(screen.getByLabelText('Volver'));
    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('muestra el título y sus acciones', async () => {
    const onPress = jest.fn();
    await render(
      <AppBar title="Ana García" actions={[{ icon: 'pencil', label: 'Editar', onPress }]} />,
    );
    expect(screen.getByText('Ana García')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Editar'));
    expect(onPress).toHaveBeenCalled();
  });
});
