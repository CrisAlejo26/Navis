import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP } from '../database/column-types';

/**
 * Los festivos de un país y un año, tal y como se guardaron.
 *
 * Es una **caché**, no un dato del negocio: se puede vaciar entera sin perder
 * nada, y se vuelve a llenar sola la próxima vez que alguien abra ese mes. Por
 * eso no lleva `church_id` —los festivos de España son los mismos para todas—
 * ni permisos: no hay nada de nadie aquí dentro.
 *
 * El año entero en una fila y en JSON, en vez de una fila por festivo: son unas
 * cincuenta entradas que **siempre se leen juntas** y que se reemplazan de
 * golpe al refrescar. Repartirlas en filas daría una tabla que se consulta
 * quince veces al pintar un mes para no ganar nada.
 */
@Entity('holiday_cache')
@Index('UQ_holiday_cache', ['country', 'year'], { unique: true })
export class HolidayCache extends BaseEntity {
  /** ISO 3166-1 alfa-2. */
  @Column({ type: 'text' })
  country: string;

  @Column({ type: 'int' })
  year: number;

  /** `Holiday[]` serializado. Se valida al leerlo, como todo lo que entra. */
  @Column({ type: 'text' })
  payload: string;

  /**
   * Cuándo se trajo. Es lo que decide si hay que volver a preguntar, y por eso
   * es una columna propia y no `updatedAt`: un cambio de formato del payload
   * tocaría `updatedAt` y haría creer que el dato está fresco.
   */
  @Column({ name: 'fetched_at', type: TIMESTAMP })
  fetchedAt: Date;
}
