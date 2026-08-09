import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/lib/i18n';

import { LoginPage } from './login';

const { signInEmail, refetchSession } = vi.hoisted(() => ({
  signInEmail: vi.fn(),
  refetchSession: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/auth-client', () => ({
  signIn: { email: signInEmail },
  useSession: () => ({ refetch: refetchSession }),
}));

const label = (key: 'auth.email' | 'auth.password' | 'auth.signIn') => i18n.t(key);

function renderLogin(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>
  );

  return { user: userEvent.setup(), ...render(<LoginPage />, { wrapper }) };
}

/**
 * Regresión: sin esperar a que el store de sesión de Better Auth se
 * refrescara, `ProtectedRoute` podía seguir viendo «sin sesión» justo
 * después de entrar y devolver al login con el formulario en blanco — había
 * que volver a escribir las credenciales.
 */
describe('LoginPage', () => {
  it('refresca la sesión y vacía la caché antes de entrar', async () => {
    signInEmail.mockResolvedValue({ error: null });
    refetchSession.mockClear();
    const queryClient = new QueryClient();
    queryClient.setQueryData(['churches'], { items: [{ id: 'iglesia-ajena' }] });

    const { user } = renderLogin(queryClient);

    await user.type(screen.getByLabelText(label('auth.email')), 'pastor@iglesia.es');
    await user.type(screen.getByLabelText(label('auth.password')), 'contraseñaSegura2026');
    await user.click(screen.getByRole('button', { name: label('auth.signIn') }));

    await waitFor(() => {
      expect(refetchSession).toHaveBeenCalledOnce();
    });
    expect(queryClient.getQueryData(['churches'])).toBeUndefined();
  });

  it('no refresca la sesión cuando el servidor rechaza las credenciales', async () => {
    signInEmail.mockResolvedValue({ error: { message: 'credenciales inválidas' } });
    refetchSession.mockClear();
    const { user } = renderLogin(new QueryClient());

    await user.type(screen.getByLabelText(label('auth.email')), 'pastor@iglesia.es');
    await user.type(screen.getByLabelText(label('auth.password')), 'mala');
    await user.click(screen.getByRole('button', { name: label('auth.signIn') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('auth.invalidCredentials'));
    expect(refetchSession).not.toHaveBeenCalled();
  });
});
