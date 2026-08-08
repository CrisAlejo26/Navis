import { SEEDED_CALENDARS } from '@navis/shared';
import type { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Calendar } from './calendar.entity';
import { CalendarsService } from './calendars.service';

const calendario = (slug: string): Calendar =>
  ({ id: `id-${slug}`, slug, churchId: 'c1' }) as Calendar;
const SEMBRADOS = SEEDED_CALENDARS.map((one) => calendario(one.slug));

/** El choque que dos peticiones sembrando a la vez dejarían en Postgres. */
const CHOQUE_UNICO = new QueryFailedError('INSERT ...', [], { code: '23505' } as unknown as Error);

function build({ saveError }: { saveError?: Error } = {}) {
  // Vacía la primera vez que se pregunta; si algo llegó a sembrar (el propio
  // `save`, o —en la carrera— la petición que ganó), la segunda ya la ve
  // llena. Así el test no necesita saber cuál de las dos ganó.
  const find = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(SEMBRADOS);
  const save = vi.fn(() => (saveError ? Promise.reject(saveError) : Promise.resolve(SEMBRADOS)));

  const repo = {
    find,
    exists: vi.fn(() => Promise.resolve(false)),
    create: (data: Partial<Calendar>) => data,
    save,
  } as unknown as Repository<Calendar>;

  return { service: new CalendarsService(repo), save, find };
}

describe('CalendarsService.ensureFor', () => {
  it('siembra los cuatro calendarios de serie si la iglesia no tiene ninguno', async () => {
    const { service, save } = build();

    const calendars = await service.ensureFor('c1');

    expect(save).toHaveBeenCalledTimes(1);
    expect(calendars).toEqual(SEMBRADOS);
  });

  it('no siembra si ya hay alguno', async () => {
    const find = vi.fn(() => Promise.resolve([calendario('pulpito')]));
    const save = vi.fn();
    const service = new CalendarsService({
      find,
      create: (data: Partial<Calendar>) => data,
      save,
    } as unknown as Repository<Calendar>);

    await service.ensureFor('c1');

    expect(save).not.toHaveBeenCalled();
  });

  // El fallo real: la primera carga de una iglesia recién creada dispara
  // varias pantallas de golpe, y más de una puede ver «ninguno» a la vez e
  // intentar sembrar los mismos cuatro.
  it('si pierde la carrera contra otra siembra, no falla: relee y devuelve lo que ya hay', async () => {
    const { service, find } = build({ saveError: CHOQUE_UNICO });

    await expect(service.ensureFor('c1')).resolves.toEqual(SEMBRADOS);
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('un error de consulta que no es un choque de únicos sí revienta', async () => {
    const { service } = build({ saveError: new Error('la base de datos está caída') });

    await expect(service.ensureFor('c1')).rejects.toThrow('la base de datos está caída');
  });
});
