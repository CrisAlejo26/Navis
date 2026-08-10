import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { OwnedChurchImpact } from '@navis/shared';
import { describe, expect, it, vi } from 'vitest';

import { ChurchDecisionRow } from '@/components/access/church-decision-row';
import { i18n } from '@/lib/i18n';
import { renderWithI18n as render } from '@/test/render';

const iglesia = (id: string, name: string) => ({
  id,
  name,
  slug: id,
  city: null,
  timezone: 'Europe/Madrid',
  country: 'ES',
  region: null,
  ownerId: 'u1',
  createdAt: new Date(),
});

vi.mock('@/lib/churches', () => ({
  useChurches: () => ({
    items: [
      iglesia('c1', 'IDMJI - Murcia'),
      iglesia('c2', 'IDMJI - Cartagena'),
      iglesia('c3', 'IDMJI - Benidorm'),
    ],
    active: null,
    isLoading: false,
  }),
}));

const IMPACTO: OwnedChurchImpact = {
  id: 'c1',
  name: 'IDMJI - Murcia',
  believers: 12,
  notes: 3,
  lists: 2,
  calendars: 1,
  congregations: 1,
  members: 2,
};

describe('ChurchDecisionRow', () => {
  it('enseña el nombre de la iglesia y sus números', () => {
    render(
      <ChurchDecisionRow
        church={IMPACTO}
        action=""
        targetChurchId={undefined}
        excludedTargetIds={[IMPACTO.id]}
        onChange={() => {}}
      />,
    );

    expect(screen.getByText('IDMJI - Murcia')).toBeInTheDocument();
  });

  it('elegir «Eliminar» avisa con esa decisión, sin destino', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChurchDecisionRow
        church={IMPACTO}
        action=""
        targetChurchId={undefined}
        excludedTargetIds={[IMPACTO.id]}
        onChange={onChange}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: i18n.t('roles.churchDecisionRequired') }),
      'delete',
    );

    expect(onChange).toHaveBeenCalledWith({ action: 'delete' });
  });

  it('elegir «Trasladar» abre el selector de destino, sin la propia iglesia', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ChurchDecisionRow
        church={IMPACTO}
        action="transfer"
        targetChurchId={undefined}
        excludedTargetIds={[IMPACTO.id]}
        onChange={onChange}
      />,
    );

    const destino = screen.getByRole('combobox', { name: i18n.t('roles.churchTransferTarget') });
    const opciones = Array.from(destino.querySelectorAll('option')).map(
      (option) => option.textContent,
    );

    expect(opciones).not.toContain('IDMJI - Murcia');
    expect(opciones).toContain('IDMJI - Cartagena');

    await user.selectOptions(destino, 'c2');
    expect(onChange).toHaveBeenCalledWith({ action: 'transfer', targetChurchId: 'c2' });
  });

  it('excluye también las iglesias marcadas para eliminar en el mismo plan', () => {
    render(
      <ChurchDecisionRow
        church={IMPACTO}
        action="transfer"
        targetChurchId={undefined}
        excludedTargetIds={[IMPACTO.id, 'c2']}
        onChange={() => {}}
      />,
    );

    const destino = screen.getByRole('combobox', { name: i18n.t('roles.churchTransferTarget') });
    const opciones = Array.from(destino.querySelectorAll('option')).map(
      (option) => option.textContent,
    );

    expect(opciones).not.toContain('IDMJI - Cartagena');
    expect(opciones).toContain('IDMJI - Benidorm');
  });
});
