import type { Holiday } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { HolidayCache } from './holiday-cache.entity';
import { HolidaysService } from './holidays.service';

const FUENTE = [
  {
    date: '2026-01-01',
    localName: 'Año Nuevo',
    name: "New Year's Day",
    global: true,
    counties: null,
  },
  {
    date: '2026-02-28',
    localName: 'Día de Andalucía',
    name: 'Day of Andalucía',
    global: false,
    counties: ['ES-AN'],
  },
];

/**
 * Un repositorio de mentira con una sola fila en memoria. Es un doble de test,
 * de ahí el `as unknown as` que la Regla 10 permite justo aquí: implementa los
 * cuatro métodos que usa el servicio y ninguno más.
 */
function repoDoble(inicial: HolidayCache | null = null) {
  const estado = { fila: inicial };

  const repo = {
    findOne: () => Promise.resolve(estado.fila),
    create: (datos: Partial<HolidayCache>) => datos as HolidayCache,
    save: (datos: HolidayCache) => {
      estado.fila = { ...datos, id: 'x' };
      return Promise.resolve(estado.fila);
    },
    update: (_id: string, datos: Partial<HolidayCache>) => {
      estado.fila = { ...(estado.fila as HolidayCache), ...datos };
      return Promise.resolve({ affected: 1 });
    },
  };

  return { estado, repo: repo as unknown as Repository<HolidayCache> };
}

function filaGuardada(holidays: Holiday[], fetchedAt: Date): HolidayCache {
  return {
    id: 'guardada',
    country: 'ES',
    year: 2026,
    payload: JSON.stringify(holidays),
    fetchedAt,
    createdAt: fetchedAt,
    updatedAt: fetchedAt,
    deletedAt: null,
  };
}

const OK = () =>
  Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(FUENTE) } as Response);

describe('los festivos', () => {
  it('los trae de la fuente la primera vez y los deja guardados', async () => {
    const fetchImpl = vi.fn(OK);
    const { estado, repo } = repoDoble();

    const holidays = await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(holidays).toHaveLength(2);
    expect(estado.fila?.payload).toContain('Día de Andalucía');
  });

  it('normaliza: el nombre local, y regional solo si la fuente dice dónde', async () => {
    const { repo } = repoDoble();
    const holidays = await new HolidaysService(repo, vi.fn(OK)).forYear('ES', 2026);

    expect(holidays[0]).toEqual({
      date: '2026-01-01',
      name: 'Año Nuevo',
      scope: 'national',
      regions: [],
    });
    expect(holidays[1]?.scope).toBe('regional');
    expect(holidays[1]?.regions).toEqual(['ES-AN']);
  });

  it('con lo guardado fresco no vuelve a preguntar', async () => {
    const fetchImpl = vi.fn(OK);
    const guardados: Holiday[] = [
      { date: '2026-01-01', name: 'Año Nuevo', scope: 'national', regions: [] },
    ];
    const { repo } = repoDoble(filaGuardada(guardados, new Date()));

    const holidays = await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(holidays).toEqual(guardados);
  });

  it('a los treinta y un días vuelve a preguntar', async () => {
    const fetchImpl = vi.fn(OK);
    const viejo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const { repo } = repoDoble(filaGuardada([], viejo));

    await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  /*
   * La regla que sostiene la funcionalidad: un servicio de terceros caído no
   * puede dejar el calendario sin cargar. Se sirve lo viejo, por viejo que sea.
   */
  it('si la fuente falla, sirve lo guardado aunque esté caducado', async () => {
    const guardados: Holiday[] = [
      { date: '2026-01-01', name: 'Año Nuevo', scope: 'national', regions: [] },
    ];
    const viejo = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    const { repo } = repoDoble(filaGuardada(guardados, viejo));
    const fetchImpl = vi.fn(() => Promise.reject(new Error('sin red')));

    const holidays = await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(holidays).toEqual(guardados);
  });

  it('si la fuente falla y no hay nada guardado, ningún festivo y ni un error', async () => {
    const { repo } = repoDoble();
    const fetchImpl = vi.fn(() => Promise.resolve({ ok: false, status: 503 } as Response));

    const holidays = await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(holidays).toEqual([]);
  });

  it('lo guardado con otra forma no se cree: se descarta', async () => {
    const rota = { ...filaGuardada([], new Date()), payload: '{"esto":"no es una lista"}' };
    const { repo } = repoDoble(rota);
    const fetchImpl = vi.fn(OK);

    const holidays = await new HolidaysService(repo, fetchImpl).forYear('ES', 2026);

    expect(holidays).toEqual([]);
  });
});

describe('el tramo', () => {
  it('recorta al tramo y filtra por comunidad', async () => {
    const { repo } = repoDoble();
    const service = new HolidaysService(repo, vi.fn(OK));

    const madrid = await service.forRange('ES', 'ES-MD', '2026-01-01', '2026-12-31');
    expect([...madrid.keys()]).toEqual(['2026-01-01']);

    const andalucía = await service.forRange('ES', 'ES-AN', '2026-01-01', '2026-12-31');
    expect([...andalucía.keys()]).toEqual(['2026-01-01', '2026-02-28']);
  });

  it('sin comunidad elegida, solo los nacionales', async () => {
    const { repo } = repoDoble();
    const service = new HolidaysService(repo, vi.fn(OK));

    const sinComunidad = await service.forRange('ES', null, '2026-01-01', '2026-12-31');

    expect([...sinComunidad.keys()]).toEqual(['2026-01-01']);
  });

  it('deja fuera lo que cae antes o después del tramo', async () => {
    const { repo } = repoDoble();
    const service = new HolidaysService(repo, vi.fn(OK));

    const febrero = await service.forRange('ES', 'ES-AN', '2026-02-01', '2026-02-28');

    expect([...febrero.keys()]).toEqual(['2026-02-28']);
  });
});
