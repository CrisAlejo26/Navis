import type { ListDay } from '@navis/shared';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Wake } from '@/components/lists/wake';
import { i18n } from '@/lib/i18n';
import { renderWithI18n as render } from '@/test/render';

const dias = (valores: number[]): ListDay[] =>
  valores.map((views, index) => ({
    day: `2026-08-${String(index + 1).padStart(2, '0')}`,
    views,
    visitors: views > 0 ? 1 : 0,
  }));

describe('la estela', () => {
  it('con pocas visitas no dibuja nada y lo dice', () => {
    render(<Wake days={dias([1, 0, 0, 2, 0])} accent="#2140cf" />);

    expect(screen.getByText(i18n.t('lists.wakeTooFew'))).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('cada día es un objetivo con su etiqueta, y la etiqueta lleva la fecha y las cifras', () => {
    render(<Wake days={dias([3, 1, 4, 2, 5])} accent="#2140cf" />);

    // Uno por día más el de «Ver los datos». El nombre se comprueba por su
    // contenido y no por el texto exacto: en los tests i18next va en inglés.
    const botones = screen.getAllByRole('button');
    expect(botones).toHaveLength(6);

    const etiquetas = botones.slice(0, 5).map((one) => one.getAttribute('aria-label') ?? '');
    expect(etiquetas.every((one) => one.includes('2026'))).toBe(true);
    expect(etiquetas[0]).toMatch(/\b3\b/);
    expect(etiquetas.at(-1)).toMatch(/\b5\b/);
  });

  it('tiene su tabla de datos detrás: el gráfico no es la única forma de leerlo', () => {
    render(<Wake days={dias([3, 1, 4, 2, 5])} accent="#2140cf" />);

    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: i18n.t('lists.seeData') }));

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6); // cinco días y la cabecera
  });

  it('un día del dibujo también abre la tabla: el foco lleva a alguna parte', () => {
    render(<Wake days={dias([3, 1, 4, 2, 5])} accent="#2140cf" />);

    fireEvent.click(screen.getAllByRole('button')[1] ?? document.body);

    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('rotula el día de más visitas: el grosor no puede informar solo', () => {
    render(<Wake days={dias([3, 1, 9, 2, 5])} accent="#2140cf" />);

    // El rótulo de la cumbre lleva la cifra del día que más se miró.
    expect(screen.getByText(/\(9\)/)).toBeInTheDocument();
  });
});
