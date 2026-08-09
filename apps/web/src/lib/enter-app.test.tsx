import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/lib/i18n';

import { useEnterApp } from './enter-app';

const { signInEmail, refetchSession } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  refetchSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('./auth-client', () => ({
  signIn: { email: signInEmail },
  useSession: () => ({ refetch: refetchSession }),
}));

/**
 * Regresión: entrar con una cuenta recién creada sin vaciar la caché dejaba
 * ver, en el mismo navegador, las iglesias de la cuenta con la que se había
 * trabajado justo antes —por ejemplo, un superadministrador que da de alta un
 * pastor y entra con él para comprobarlo—.
 *
 * Y regresión aparte: sin esperar a `refetch()`, el store de sesión de Better
 * Auth podía seguir marcando «sin sesión» justo cuando `ProtectedRoute` lo
 * miraba, y devolvía al login con la cuenta recién creada.
 */
describe('useEnterApp', () => {
  it('refresca la sesión y vacía la caché de TanStack Query al entrar', async () => {
    signInEmail.mockResolvedValue({ error: null });
    const queryClient = new QueryClient();
    queryClient.setQueryData(['churches'], { items: [{ id: 'iglesia-ajena' }] });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    );

    const { result } = renderHook(() => useEnterApp(), { wrapper });
    await act(async () => {
      await result.current('pastor@iglesia.es', 'contraseñaSegura2026');
    });

    expect(refetchSession).toHaveBeenCalledOnce();
    await waitFor(() => {
      expect(queryClient.getQueryData(['churches'])).toBeUndefined();
    });
  });

  it('no toca la sesión ni la caché cuando el servidor rechaza la entrada', async () => {
    signInEmail.mockResolvedValue({ error: { message: 'credenciales inválidas' } });
    refetchSession.mockClear();
    const queryClient = new QueryClient();
    queryClient.setQueryData(['churches'], { items: [{ id: 'iglesia-propia' }] });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>{children}</MemoryRouter>
        </QueryClientProvider>
      </I18nextProvider>
    );

    const { result } = renderHook(() => useEnterApp(), { wrapper });
    const error = await act(async () => result.current('pastor@iglesia.es', 'mala'));

    expect(error).toBe(i18n.t('errors.generic'));
    expect(refetchSession).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(['churches'])).toEqual({ items: [{ id: 'iglesia-propia' }] });
  });
});
