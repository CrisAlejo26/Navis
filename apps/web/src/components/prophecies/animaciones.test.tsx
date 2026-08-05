import type { ProphecyFulfillment, ProphecyListItem } from '@navis/shared';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { FulfillmentCards } from '@/components/prophecies/fulfillment-cards';
import { FulfillmentList } from '@/components/prophecies/fulfillment-list';
import { Travesia } from '@/components/prophecies/travesia';
import { renderWithI18n } from '@/test/render';

const HOY = '2026-08-05';

const palabra = (index: number): ProphecyListItem => ({
  id: `p${String(index)}`,
  title: `Profecía ${String(index)}`,
  excerpt: 'Texto',
  receivedAt: '2026-01-01',
  fulfilledAt: null,
  lastFulfillmentAt: null,
  state: 'espera',
  waitingDays: 216,
  fulfillmentsCount: 0,
  fulfillmentDays: [],
});

const cumplimiento = (index: number): ProphecyFulfillment => ({
  id: `f${String(index)}`,
  prophecyId: 'p1',
  text: `Se cumplió la parte ${String(index)}`,
  occurredAt: '2026-05-02',
  createdAt: '2026-05-02T10:00:00.000Z',
});

/** Los retardos que llevan puestos los elementos de una lista, en orden. */
const retardos = (nodes: NodeListOf<HTMLElement>) =>
  [...nodes].map((node) => node.style.animationDelay);

/**
 * Que las entradas **estén animadas** y **escalonadas**.
 *
 * Existe porque «no se ve ninguna animación» es un fallo que no rompe nada: la
 * pantalla sigue funcionando, los demás tests siguen pasando y solo se nota
 * mirando. Aquí se comprueba que la clase está puesta y que el retardo crece
 * fila a fila; que el movimiento se vea bien es cosa del guion de navegador.
 *
 * `prefers-reduced-motion` las apaga desde `global.css`, así que tenerlas
 * puestas no contradice la Regla 9 §5.
 */
describe('las entradas escalonadas', () => {
  it('la travesía anima cada fila y cada trayecto', () => {
    const { container } = renderWithI18n(
      <MemoryRouter>
        <Travesia items={[palabra(1), palabra(2), palabra(3)]} today={HOY} />
      </MemoryRouter>,
    );

    const filas = container.querySelectorAll<HTMLElement>('li.animate-rise-in');
    expect(filas).toHaveLength(3);
    expect(retardos(filas)).toEqual(['0ms', '40ms', '80ms']);

    // Y dentro de cada fila, el trayecto se dibuja de izquierda a derecha.
    expect(container.querySelectorAll('.animate-track-in')).toHaveLength(3);
  });

  it('los cumplimientos de la bitácora entran de arriba abajo', () => {
    const { container } = renderWithI18n(
      <FulfillmentList
        fulfillments={[cumplimiento(1), cumplimiento(2)]}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    const items = container.querySelectorAll<HTMLElement>('li.animate-rise-in');
    expect(items).toHaveLength(2);
    expect(retardos(items)).toEqual(['0ms', '55ms']);
  });

  it('y las fichas de cumplimiento también', () => {
    const { container } = renderWithI18n(
      <FulfillmentCards
        fulfillments={[cumplimiento(1), cumplimiento(2)]}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(container.querySelectorAll('li.animate-rise-in')).toHaveLength(2);
  });

  it('el escalonado se corta: cien filas no hacen esperar cuatro segundos', () => {
    const muchas = Array.from({ length: 20 }, (_, index) => palabra(index));
    const { container } = renderWithI18n(
      <MemoryRouter>
        <Travesia items={muchas} today={HOY} />
      </MemoryRouter>,
    );

    const delays = retardos(container.querySelectorAll<HTMLElement>('li.animate-rise-in'));
    // A partir de la duodécima, todas comparten el mismo retardo.
    expect(delays.at(-1)).toBe('480ms');
    expect(delays.at(12)).toBe('480ms');
  });
});
