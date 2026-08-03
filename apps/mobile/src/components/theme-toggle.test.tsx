import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeStore } from '@/lib/theme';

/**
 * En @testing-library/react-native 14 tanto `render` como `fireEvent` son
 * asíncronos (React 19 hace el `act` en promesa): hay que esperarlos.
 */
describe('ThemeToggle', () => {
  beforeEach(() => {
    useThemeStore.getState().setMode('system');
  });

  it('arranca siguiendo al sistema', async () => {
    await render(<ThemeToggle />);
    expect(screen.getByLabelText('Sistema')).toBeTruthy();
    expect(useThemeStore.getState().mode).toBe('system');
  });

  it('cambia a oscuro al pulsar su opción', async () => {
    await render(<ThemeToggle />);
    await fireEvent.press(screen.getByLabelText('Oscuro'));
    expect(useThemeStore.getState().mode).toBe('dark');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });
});
