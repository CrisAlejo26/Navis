import { fireEvent, render, screen } from '@testing-library/react-native';

import { MoreMenuContent } from '@/components/navigation/more-menu-content';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => {
      mockPush(...args);
    },
  },
}));

/** El menú «Más» debe exponer todas las secciones y navegar a cada ruta. */
describe('MoreMenuContent', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('muestra los dos grupos con sus encabezados', async () => {
    await render(<MoreMenuContent />);
    expect(screen.getByText('General')).toBeTruthy();
    expect(screen.getByText('La iglesia')).toBeTruthy();
  });

  it('muestra las secciones personales y de la iglesia', async () => {
    await render(<MoreMenuContent />);
    for (const label of ['Profecías', 'Sueños', 'Enseñanzas']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    for (const label of ['Listas', 'Tablas', 'Notas', 'Tareas', 'Comunicaciones', 'Usuarios']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('navega a la ruta de la entrada pulsada', async () => {
    await render(<MoreMenuContent />);
    await fireEvent.press(screen.getByText('Profecías'));
    expect(mockPush).toHaveBeenCalledWith('/prophecies');
    await fireEvent.press(screen.getByText('Usuarios'));
    expect(mockPush).toHaveBeenCalledWith('/users');
  });
});
