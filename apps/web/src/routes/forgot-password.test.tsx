import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/lib/i18n';

import { ForgotPasswordPage } from './forgot-password';

const { requestPasswordReset } = vi.hoisted(() => ({ requestPasswordReset: vi.fn() }));
vi.mock('@/lib/auth-client', () => ({ requestPasswordReset }));

const label = (key: 'auth.email' | 'auth.sendResetLink') => i18n.t(key);

function renderPage() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{children}</MemoryRouter>
    </I18nextProvider>
  );

  return { user: userEvent.setup(), ...render(<ForgotPasswordPage />, { wrapper }) };
}

describe('ForgotPasswordPage', () => {
  it('pide el enlace con el callback de vuelta y enseña la confirmación', async () => {
    requestPasswordReset.mockResolvedValue({ error: null });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(label('auth.email')), 'alguien@iglesia.es');
    await user.click(screen.getByRole('button', { name: label('auth.sendResetLink') }));

    expect(requestPasswordReset).toHaveBeenCalledWith({
      email: 'alguien@iglesia.es',
      redirectTo: expect.stringMatching(/\/reset-password$/),
    });
    expect(await screen.findByText(i18n.t('auth.resetLinkSent'))).toBeInTheDocument();
  });

  it('enseña el error genérico si el servidor falla, sin decir si el correo existe', async () => {
    requestPasswordReset.mockResolvedValue({ error: { message: 'network error' } });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(label('auth.email')), 'alguien@iglesia.es');
    await user.click(screen.getByRole('button', { name: label('auth.sendResetLink') }));

    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('errors.generic'));
  });
});
