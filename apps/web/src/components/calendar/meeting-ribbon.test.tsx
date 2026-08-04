import type { Meeting } from '@navis/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { renderWithI18n as render } from '@/test/render';

const reunion: Meeting = {
  id: 'm1',
  congregationId: 'elda',
  patternId: null,
  name: 'Culto',
  startTime: '20:00',
  accent: 'success',
  status: 'programada',
  notes: null,
  slots: [
    {
      id: 's1',
      name: 'Introducción',
      position: 0,
      note: null,
      believer: { id: 'b1', name: 'Juan Carlos' },
    },
    { id: 's2', name: 'Enseñanza', position: 1, note: null, believer: null },
  ],
};

describe('la cinta de fases', () => {
  it('pinta las fases en orden con quien las ocupa', () => {
    render(<MeetingRibbon meeting={reunion} date="2026-08-15" congregationName="Elda" />);

    const fases = screen.getAllByText(/Introducción|Enseñanza/);
    expect(fases.map((fase) => fase.textContent)).toEqual(['Introducción', 'Enseñanza']);
    expect(screen.getByText('Juan Carlos')).toBeInTheDocument();
    expect(screen.getByText('Elda')).toBeInTheDocument();
  });

  it('deja ver el hueco de la fase que no tiene a nadie', async () => {
    const onPick = vi.fn();
    render(<MeetingRibbon meeting={reunion} date="2026-08-15" onPick={onPick} />);

    // La fase vacía se anuncia como tal, que es lo que hoy se pierde en la
    // hoja de cálculo: si falta alguien, tiene que verse.
    const vacia = screen.getByRole('button', { name: /Enseñanza/ });
    expect(vacia).toHaveAccessibleName(/sin asignar|unassigned|non attribué/i);

    await userEvent.click(vacia);
    expect(onPick).toHaveBeenCalledWith(reunion.slots[1], reunion, '2026-08-15');
  });

  it('sin permiso para programar, las fases no son botones', () => {
    render(<MeetingRibbon meeting={reunion} date="2026-08-15" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('una reunión cancelada no se puede tocar', () => {
    render(
      <MeetingRibbon
        meeting={{ ...reunion, status: 'cancelada' }}
        date="2026-08-15"
        onPick={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
