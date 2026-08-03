import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AccountForm } from '@/components/auth/account-form';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

/** Los textos se piden a i18next para que el test valga en los seis idiomas. */
const label = (key: 'auth.name' | 'auth.email' | 'auth.password' | 'auth.showPassword') =>
  i18n.t(key);

function renderForm(onSubmit = vi.fn().mockResolvedValue(null)) {
  renderWithI18n(<AccountForm submitLabel="Crear" submittingLabel="Creando" onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
}

describe('AccountForm', () => {
  it('no envía nada y señala los campos cuando el formulario está vacío', async () => {
    const { onSubmit, user } = renderForm();

    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText(label('auth.email'))).toHaveAttribute('aria-invalid', 'true');
  });

  it('envía los valores válidos', async () => {
    const { onSubmit, user } = renderForm();

    await user.type(screen.getByLabelText(label('auth.name')), 'Ana Pastora');
    await user.type(screen.getByLabelText(label('auth.email')), '  Ana@Iglesia.ES ');
    await user.type(screen.getByLabelText(label('auth.password')), 'Rebano2026Seguro');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    // El esquema normaliza el correo antes de que llegue al servidor.
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana Pastora',
      email: 'ana@iglesia.es',
      password: 'Rebano2026Seguro',
    });
  });

  it('enseña el error que devuelve el servidor', async () => {
    const { user } = renderForm(vi.fn().mockResolvedValue('Ese correo ya está cogido'));

    await user.type(screen.getByLabelText(label('auth.name')), 'Ana Pastora');
    await user.type(screen.getByLabelText(label('auth.email')), 'ana@iglesia.es');
    await user.type(screen.getByLabelText(label('auth.password')), 'Rebano2026Seguro');
    await user.click(screen.getByRole('button', { name: 'Crear' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese correo ya está cogido');
  });

  it('deja ver la contraseña con el interruptor', async () => {
    const { user } = renderForm();
    const field = screen.getByLabelText(label('auth.password'));

    expect(field).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: label('auth.showPassword') }));
    expect(field).toHaveAttribute('type', 'text');
  });
});
