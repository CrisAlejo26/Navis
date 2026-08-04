import { screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { PwaUpdatePrompt } from '@/components/pwa-update-prompt';
import { i18n } from '@/lib/i18n';
import { useToastStore } from '@/lib/toast';
import { resetServiceWorker, serviceWorker } from '@/test/pwa-register';
import { renderWithI18n } from '@/test/render';

/**
 * Test de regresión: el aviso de «ya funciona sin conexión» era una banda fija
 * abajo que había que cerrar a mano, y en un teléfono se quedaba encima de la
 * acción principal de la pantalla —«Ver más» en la bitácora, por ejemplo—.
 */
describe('el aviso de la PWA', () => {
  beforeEach(() => {
    resetServiceWorker();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    resetServiceWorker();
  });

  it('cuando ya funciona sin conexión lo dice y no deja nada en pantalla', () => {
    serviceWorker.offlineReady = true;
    renderWithI18n(<PwaUpdatePrompt />);

    // Se anuncia por el mismo camino que el resto de avisos, que se van solos.
    expect(useToastStore.getState().toasts.map((one) => one.message)).toEqual([
      i18n.t('pwa.offlineReady'),
    ]);
    // Y no queda ninguna banda tapando el final de la página.
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('cuando hay versión nueva no se va sola: es una decisión', () => {
    serviceWorker.needRefresh = true;
    renderWithI18n(<PwaUpdatePrompt />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: i18n.t('pwa.reload') })).toBeInTheDocument();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('el aviso de versión nueva se puede quitar de en medio', async () => {
    serviceWorker.needRefresh = true;
    renderWithI18n(<PwaUpdatePrompt />);

    await userEvent.click(screen.getByRole('button', { name: i18n.t('common.close') }));

    expect(screen.queryByRole('status')).toBeNull();
    // Cerrarlo no actualiza: recargar sigue siendo una decisión aparte.
    expect(serviceWorker.updates).toBe(0);
  });

  it('recargar solo ocurre al pulsarlo', async () => {
    serviceWorker.needRefresh = true;
    renderWithI18n(<PwaUpdatePrompt />);

    await userEvent.click(screen.getByRole('button', { name: i18n.t('pwa.reload') }));

    expect(serviceWorker.updates).toBe(1);
  });
});
