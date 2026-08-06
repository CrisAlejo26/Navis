import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { holidayApplies, holidaySchema, type Holiday } from '@navis/shared';
import { Repository } from 'typeorm';
import { z } from 'zod';

import { env } from '../config/env';
import { HolidayCache } from './holiday-cache.entity';
import { fetchHolidays } from './nager';

const guardado = z.array(holidaySchema);

/** Lo guardado se da por bueno un mes. Ver `forYear`. */
const FRESCO_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * El `fetch` con el que se sale a la calle, inyectado.
 *
 * Es la única dependencia externa de este módulo, y así los tests le pasan uno
 * de mentira en vez de tocar la red o mockear un global (Regla 4 §4).
 */
export const HOLIDAYS_FETCH = Symbol('HOLIDAYS_FETCH');

/**
 * Los festivos, **sin tarea programada** (RFC 0011).
 *
 * El trato es este: cuando alguien abre un mes, se mira si el año está
 * guardado. Si no está, o se guardó hace más de treinta días, se pide a la
 * fuente y se guarda. El resto del año no se pide nada. Un cron que se baje
 * enero cada año sería una pieza más que puede fallar en silencio, y el fallo
 * se descubriría en marzo.
 *
 * Y la regla que lo sostiene: **si la fuente falla, se sirve lo guardado**, por
 * viejo que sea. Un calendario sin festivos por un rato es un defecto; un
 * calendario que no carga porque un servicio de terceros está caído es un
 * calendario roto, y las reuniones no dependen de esto.
 */
@Injectable()
export class HolidaysService {
  private readonly logger = new Logger(HolidaysService.name);

  constructor(
    @InjectRepository(HolidayCache) private readonly cache: Repository<HolidayCache>,
    @Inject(HOLIDAYS_FETCH) private readonly fetchImpl: typeof fetch,
  ) {}

  /**
   * Los festivos de esta iglesia entre dos días, ya filtrados por su comunidad.
   *
   * El tramo puede cruzar el fin de año —el calendario precarga el mes anterior
   * y el siguiente—, así que se piden todos los años que toque.
   */
  async forRange(
    country: string,
    region: string | null,
    from: string,
    to: string,
  ): Promise<Map<string, Holiday>> {
    const primero = Number(from.slice(0, 4));
    const último = Number(to.slice(0, 4));
    if (!Number.isInteger(primero) || !Number.isInteger(último)) return new Map();

    const porDía = new Map<string, Holiday>();

    for (let year = primero; year <= último; year++) {
      for (const holiday of await this.forYear(country, year)) {
        if (holiday.date < from || holiday.date > to) continue;
        if (!holidayApplies(holiday, region)) continue;

        // Dos festivos el mismo día pasa —uno nacional y otro de la comunidad—.
        // Se queda el nacional, que es el que manda y el que todo el mundo
        // reconoce; el otro no cabe en una celda de la rejilla.
        const previo = porDía.get(holiday.date);
        if (!previo || (previo.scope === 'regional' && holiday.scope === 'national')) {
          porDía.set(holiday.date, holiday);
        }
      }
    }

    return porDía;
  }

  /** Un año entero, del almacén o de la fuente. Nunca lanza. */
  async forYear(country: string, year: number): Promise<Holiday[]> {
    const fila = await this.cache.findOne({ where: { country, year } });
    if (fila && !this.caducado(fila)) return parse(fila.payload);

    if (!env.HOLIDAYS_API_URL) return fila ? parse(fila.payload) : [];

    try {
      const holidays = await fetchHolidays(env.HOLIDAYS_API_URL, country, year, this.fetchImpl);
      await this.guardar(fila, country, year, holidays);

      return holidays;
    } catch (cause) {
      // Lo de siempre antes que nada: si hay algo guardado, se sirve.
      this.logger.warn(
        `No se pudieron traer los festivos de ${country} ${String(year)}: ${msg(cause)}`,
      );

      return fila ? parse(fila.payload) : [];
    }
  }

  private caducado(fila: HolidayCache): boolean {
    return Date.now() - fila.fetchedAt.getTime() > FRESCO_MS;
  }

  private async guardar(
    fila: HolidayCache | null,
    country: string,
    year: number,
    holidays: readonly Holiday[],
  ): Promise<void> {
    const payload = JSON.stringify(holidays);
    const fetchedAt = new Date();

    if (fila) {
      await this.cache.update(fila.id, { payload, fetchedAt });
      return;
    }

    await this.cache.save(this.cache.create({ country, year, payload, fetchedAt }));
  }
}

/**
 * Lo guardado no se cree: se valida. Es texto en una columna y pudo escribirlo
 * una versión anterior con otro formato; ante la duda, ningún festivo, que es
 * exactamente lo que había antes de esta funcionalidad.
 */
function parse(payload: string): Holiday[] {
  let value: unknown;
  try {
    value = JSON.parse(payload || '[]');
  } catch {
    return [];
  }

  const parsed = guardado.safeParse(value);

  return parsed.success ? parsed.data : [];
}

function msg(cause: unknown): string {
  return cause instanceof Error ? cause.message : 'error desconocido';
}
