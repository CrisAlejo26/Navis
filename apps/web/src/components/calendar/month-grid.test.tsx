import type { CalendarRange } from '@navis/shared';
import { eachDay } from '@navis/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { MonthGrid } from '@/components/calendar/month-grid';
import { renderWithI18n as render } from '@/test/render';

/** El mes de agosto de 2026, encuadrado en semanas completas. */
const rango: CalendarRange = {
  from: '2026-07-27',
  to: '2026-09-06',
  congregations: [],
  days: eachDay('2026-07-27', '2026-09-06').map((date) => ({
    date,
    holiday: null,
    meetings:
      date === '2026-08-07'
        ? [
            {
              id: 'm1',
              congregationId: 'elda',
              patternId: 'p1',
              name: 'Culto',
              startTime: '20:00',
              accent: 'success',
              status: 'programada' as const,
              notes: null,
              slots: [
                {
                  id: 's1',
                  name: 'Enseñanza',
                  position: 0,
                  note: null,
                  believer: { id: 'b1', name: 'Luis Fernando' },
                },
              ],
            },
          ]
        : [],
  })),
};

describe('la rejilla del mes', () => {
  it('pinta seis semanas completas y la reunión en su día', () => {
    render(
      <MonthGrid
        range={rango}
        anchorMonth="2026-08-15"
        congregationName={() => 'Elda'}
        onOpenDay={vi.fn()}
      />,
    );

    // 42 días: del lunes de la primera semana al domingo de la última. Los
    // días se buscan por su marca y no por su etiqueta, que la escribe `Intl`
    // en el idioma del entorno y aquí no es el español.
    expect(document.querySelectorAll('[data-day-button]')).toHaveLength(42);
    expect(screen.getByText('Luis Fernando')).toBeInTheDocument();
    expect(screen.getByText('Elda')).toBeInTheDocument();
  });

  /*
   * El festivo es contexto para decidir si se adelanta la reunión, así que
   * tiene que verse en la rejilla sin abrir el día. Y el color no informa
   * solo: al punto rojo le acompaña el nombre (Regla 9 §5).
   */
  it('marca el día festivo con su nombre y dice de qué alcance es', () => {
    const conFestivo: CalendarRange = {
      ...rango,
      days: rango.days.map((day) =>
        day.date === '2026-08-15'
          ? {
              ...day,
              holiday: {
                date: '2026-08-15',
                name: 'Asunción de la Virgen',
                scope: 'national' as const,
                regions: [],
              },
            }
          : day,
      ),
    };

    render(
      <MonthGrid
        range={conFestivo}
        anchorMonth="2026-08-15"
        congregationName={() => 'Elda'}
        onOpenDay={vi.fn()}
      />,
    );

    expect(screen.getByText('Asunción de la Virgen')).toBeInTheDocument();
    expect(screen.getByLabelText(/Asunción de la Virgen/)).toBeInTheDocument();
  });

  it('abre el día al pulsar su número', async () => {
    const onOpenDay = vi.fn();
    render(
      <MonthGrid
        range={rango}
        anchorMonth="2026-08-15"
        congregationName={() => undefined}
        onOpenDay={onOpenDay}
      />,
    );

    await userEvent.click(screen.getByLabelText(/7 de agosto|August 7/i));
    expect(onOpenDay).toHaveBeenCalledWith('2026-08-07');
  });

  it('se recorre con las flechas del teclado, un día y una semana a la vez', async () => {
    render(
      <MonthGrid
        range={rango}
        anchorMonth="2026-08-15"
        congregationName={() => undefined}
        onOpenDay={vi.fn()}
      />,
    );

    const dia = screen.getByLabelText(/7 de agosto|August 7/i);
    dia.focus();

    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toHaveAccessibleName(/8 de agosto|August 8/i);

    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toHaveAccessibleName(/15 de agosto|August 15/i);
  });
});
