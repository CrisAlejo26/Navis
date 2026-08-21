import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { AppNav, type NavBranch } from '@/components/app-nav';
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

  it('edita o borra un calendario desde su propia fila, sin salir de la barra', async () => {
    const user = userEvent.setup();
    const onEditEntry = vi.fn();
    const onDeleteEntry = vi.fn();
    const branches: Partial<Record<string, NavBranch>> = {
      calendars: {
        entries: [{ to: '/calendar/pulpito', label: 'Púlpito', id: 'cal-1' }],
        addLabelKey: 'calendar.addCalendar',
        onEditEntry,
        onDeleteEntry,
      },
    };

    render(
      <MemoryRouter initialEntries={['/calendar/pulpito']}>
        <AppNav items={NAV_ITEMS} branches={branches} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: i18n.t('common.actions') }));
    await user.click(await screen.findByRole('menuitem', { name: i18n.t('common.edit') }));

    await waitFor(() => {
      expect(onEditEntry).toHaveBeenCalledWith('cal-1');
    });
    expect(onDeleteEntry).not.toHaveBeenCalled();
  });

  it('sin permiso para gestionar calendarios, la fila no lleva menú de acciones', () => {
    const branches: Partial<Record<string, NavBranch>> = {
      calendars: {
        entries: [{ to: '/calendar/pulpito', label: 'Púlpito', id: 'cal-1' }],
        addLabelKey: 'calendar.addCalendar',
      },
    };

    render(
      <MemoryRouter initialEntries={['/calendar/pulpito']}>
        <AppNav items={NAV_ITEMS} branches={branches} />
      </MemoryRouter>,
    );

    expect(
      screen.queryByRole('button', { name: i18n.t('common.actions') }),
    ).not.toBeInTheDocument();
  });
});
