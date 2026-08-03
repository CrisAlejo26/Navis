import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ThemeToggle } from '@/components/theme-toggle';
import { useThemeStore } from '@/lib/theme';
// Con el proveedor de i18next, como en main.tsx: sin él los componentes pintan
// la clave en crudo y estas expresiones regulares casarían con `theme.dark`.
import { renderWithI18n as render } from '@/test/render';

describe('ThemeToggle', () => {
  it('cambia el modo y añade la clase dark al documento', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(
      screen.getByRole('radio', { name: /oscuro|dark|sombre|escuro|dunkel|scuro/i }),
    );

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(screen.getByRole('radio', { name: /claro|light|clair|hell|chiaro/i }));

    expect(useThemeStore.getState().resolvedTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('marca como seleccionada la opción activa', () => {
    useThemeStore.getState().setMode('system');
    render(<ThemeToggle />);

    const systemOption = screen.getByRole('radio', { name: /sistema|system|système/i });
    expect(systemOption).toHaveAttribute('aria-checked', 'true');
  });
});
