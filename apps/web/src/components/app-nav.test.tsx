import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { AppNav } from '@/components/app-nav';
import { i18n } from '@/lib/i18n';
import { NAV_ITEMS } from '@/lib/nav';
import { renderWithI18n as render } from '@/test/render';

const renderNav = (collapsed: boolean) =>
  render(
    <MemoryRouter>
      <AppNav items={NAV_ITEMS} collapsed={collapsed} />
    </MemoryRouter>,
  );

describe('AppNav', () => {
  it('enseña el nombre de cada entrada cuando la barra está desplegada', () => {
    renderNav(false);

    expect(screen.getByRole('link', { name: i18n.t('nav.dashboard') })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(NAV_ITEMS.length);
  });

  it('conserva el nombre accesible al plegarse, aunque el texto no se vea', () => {
    renderNav(true);

    // Plegada solo hay iconos: sin el texto para lectores de pantalla, los
    // enlaces se quedarían sin nombre y la navegación sería inservible.
    const enlace = screen.getByRole('link', { name: i18n.t('nav.calendar') });
    expect(enlace.querySelector('.sr-only')).not.toBeNull();
  });
});
