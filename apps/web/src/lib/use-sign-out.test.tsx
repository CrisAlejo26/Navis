import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { useSignOut } from './use-sign-out';

vi.mock('./auth-client', () => ({ signOut: vi.fn().mockResolvedValue(undefined) }));

/**
 * Regresión: cerrar sesión sin vaciar la caché dejaba a quien entrara
 * después, en el mismo navegador, viendo iglesias y usuarios de la cuenta
 * anterior — ninguna clave de `queryKeys` lleva el id de usuario.
 */
describe('useSignOut', () => {
  it('vacía la caché de TanStack Query al cerrar sesión', async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['churches'], { items: [{ id: 'iglesia-ajena' }] });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useSignOut(), { wrapper });
    await act(async () => {
      await result.current();
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(['churches'])).toBeUndefined();
    });
  });
});
