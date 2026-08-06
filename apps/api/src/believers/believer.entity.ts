import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_ALERT_AFTER_DAYS, type BelieverStatus } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import { BelieverGift } from './believer-gift.entity';
import { BelieverMinistry } from './believer-ministry.entity';

/**
 * Una persona de la iglesia, con su ficha completa (RFC 0003 §5.1).
 *
 * Continúa la tabla del núcleo mínimo de la RFC 0002 §6; no crea otra (D1).
 * Se asigna a un creyente y no a una cuenta: quien predica no tiene por qué
 * tener usuario en Navis. `user_id` queda reservado para el día en que lo
 * tenga —«te toca el viernes» de la RFC 0006—, y hoy no lo usa nadie.
 */
@Entity('believers')
@Index('IDX_believers_church_search', ['churchId', 'searchName'])
export class Believer extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiPropertyOptional({ description: 'Su sede habitual. No acota nada: solo ordena y etiqueta' })
  @Column({ name: 'congregation_id', type: UUID, nullable: true })
  congregationId: string | null;

  @ApiProperty({ example: 'Juan Carlos' })
  @Column({ name: 'first_name', type: 'text' })
  firstName: string;

  @ApiProperty({ example: 'Ruiz' })
  @Column({ name: 'last_name', type: 'text', default: '' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Para avisar de un cambio de última hora' })
  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Dónde está hoy: activo, nuevo, inactivo o trasladado (D2)' })
  @Column({ type: 'text', default: 'activo' })
  status: BelieverStatus;

  @ApiProperty({ description: 'El nombre completo en minúsculas y sin acentos, para buscar (D14)' })
  @Column({ name: 'search_name', type: 'text', default: '' })
  searchName: string;

  @ApiPropertyOptional({ description: 'Días de margen sin nota. `null` apaga el aviso (D3)' })
  @Column({
    name: 'alert_after_days',
    type: 'int',
    nullable: true,
    default: DEFAULT_ALERT_AFTER_DAYS,
  })
  alertAfterDays: number | null;

  @ApiPropertyOptional({
    description: 'Derivado de la última nota; lo escribe solo NotesService (D4)',
  })
  @Column({ name: 'last_note_at', type: 'date', nullable: true })
  lastNoteAt: string | null;

  /*
   * La trayectoria en la iglesia (RFC 0012). Todo nulable: son datos que se
   * completan con los años y una ficha a medias es lo normal.
   */

  @ApiPropertyOptional({ description: 'Mes y año en que llegó; se guarda el día 1' })
  @Column({ name: 'arrived_at', type: 'date', nullable: true })
  arrivedAt: string | null;

  @ApiPropertyOptional({ description: 'La sede donde llegó, tal y como se escribió' })
  @Column({ name: 'arrival_site', type: 'text', nullable: true })
  arrivalSite: string | null;

  @ApiPropertyOptional({ description: 'Cuántas veces ha leído la Biblia entera' })
  @Column({ name: 'bible_readings', type: 'int', nullable: true })
  bibleReadings: number | null;

  @ApiPropertyOptional({ description: 'Cuántas veces ha leído el libro de vivencias' })
  @Column({ name: 'vivencias_readings', type: 'int', nullable: true })
  vivenciasReadings: number | null;

  @ApiPropertyOptional({ description: 'En cuántos institutos bíblicos ha participado' })
  @Column({ name: 'bible_institute_times', type: 'int', nullable: true })
  bibleInstituteTimes: number | null;

  @ApiPropertyOptional({ description: 'Su cuenta, si la tiene. Reservado (RFC 0002 §6.3)' })
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  /**
   * Su fotografía, si la tiene: la clave del fichero en disco.
   *
   * **La imagen no está aquí**, como los audios: vive bajo `UPLOADS_PATH`, en
   * la carpeta de su iglesia, y esta columna es lo único que la encuentra. Es
   * opcional del todo —casi nadie va a subirla— y por eso la interfaz no
   * inventa un círculo con iniciales cuando falta: enseña lo que hay.
   */
  @ApiPropertyOptional({ description: 'El nombre del fichero en disco, generado por el servidor' })
  @Column({ name: 'photo_key', type: 'text', nullable: true })
  photoKey: string | null;

  @OneToMany(() => BelieverMinistry, (ministry) => ministry.believer, { cascade: true })
  ministries: BelieverMinistry[];

  @OneToMany(() => BelieverGift, (gift) => gift.believer, { cascade: true })
  gifts: BelieverGift[];
}
