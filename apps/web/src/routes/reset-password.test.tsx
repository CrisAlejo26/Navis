import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { i18n } from '@/lib/i18n';

import { ResetPasswordPage } from './reset-password';

const { resetPassword } = vi.hoisted(() => ({ resetPassword: vi.fn() }));
vi.mock('@/lib/auth-client', () => ({ resetPassword }));

const label = (key: 'auth.newPassword' | 'auth.confirmPassword' | 'auth.resetPassword') =>
  i18n.t(key);

function renderPage(path = '/reset-password?token=un-token-valido') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
    </I18nextProvider>
  );

  return { user: userEvent.setup(), ...render(<ResetPasswordPage />, { wrapper }) };
}

describe('ResetPasswordPage', () => {
  it('sin token en la URL enseña el estado de enlace inválido sin llamar al servidor', () => {
    resetPassword.mockClear();
    renderPage('/reset-password');

    expect(screen.getByText(i18n.t('auth.invalidResetToken'))).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('con las contraseñas coincidiendo, cambia la contraseña con el token de la URL', async () => {
    resetPassword.mockClear();
    resetPassword.mockResolvedValue({ error: null });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(label('auth.newPassword')), 'Contraseña2026');
    await user.type(screen.getByLabelText(label('auth.confirmPassword')), 'Contraseña2026');
    await user.click(screen.getByRole('button', { name: label('auth.resetPassword') }));

    expect(resetPassword).toHaveBeenCalledWith({
      newPassword: 'Contraseña2026',
      token: 'un-token-valido',
    });
    expect(await screen.findByText(i18n.t('auth.passwordReset'))).toBeInTheDocument();
  });

  it('si las dos contraseñas no coinciden, no llega a llamar al servidor', async () => {
    resetPassword.mockClear();
    const { user } = renderPage();

    await user.type(screen.getByLabelText(label('auth.newPassword')), 'Contraseña2026');
    await user.type(screen.getByLabelText(label('auth.confirmPassword')), 'Otra2026Distinta');
    await user.click(screen.getByRole('button', { name: label('auth.resetPassword') }));

    expect(await screen.findByText(i18n.t('auth.passwordsDontMatch'))).toBeInTheDocument();
    expect(resetPassword).not.toHaveBeenCalled();
  });

  it('un token caducado o ya usado enseña el estado de enlace inválido', async () => {
    resetPassword.mockClear();
    resetPassword.mockResolvedValue({ error: { code: 'INVALID_TOKEN' } });
    const { user } = renderPage();

    await user.type(screen.getByLabelText(label('auth.newPassword')), 'Contraseña2026');
    await user.type(screen.getByLabelText(label('auth.confirmPassword')), 'Contraseña2026');
    await user.click(screen.getByRole('button', { name: label('auth.resetPassword') }));

    expect(await screen.findByText(i18n.t('auth.invalidResetToken'))).toBeInTheDocument();
  });
});
