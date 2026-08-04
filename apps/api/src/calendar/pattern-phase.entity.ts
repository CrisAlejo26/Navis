import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { MeetingPattern } from './meeting-pattern.entity';

/**
 * Las fases por defecto de un patrón, en su orden: introducción, enseñanza,
 * testimonios, cierre… Son **texto de cada iglesia** y no un enum ni un
 * catálogo global (D6): cada congregación llama a las cosas como las llama, y
 * traducirlas a seis idiomas sería inventar un vocabulario que nadie usa.
 *
 * Al materializar una reunión, esta lista se copia a sus `meeting_slots`; a
 * partir de ahí la reunión es dueña de sus fases y el patrón ya no la toca.
 */
@Entity('pattern_phases')
@Index('IDX_pattern_phases_order', ['patternId', 'position'])
export class PatternPhase extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'pattern_id', type: UUID })
  patternId: string;

  /*
   * El otro lado se referencia **por nombre** y el tipo va envuelto en
   * `Relation<>`: con la clase importada de verdad, `emitDecoratorMetadata`
   * la evalúa al cargar el módulo y el par padre-hijo se queda en un ciclo
   * («Cannot access 'MeetingPattern' before initialization»).
   */
  @ManyToOne('MeetingPattern', 'phases', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pattern_id' })
  pattern: Relation<MeetingPattern>;

  @ApiProperty({ example: 'Enseñanza' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Orden dentro de la reunión, empezando en 0' })
  @Column({ type: 'int' })
  position: number;
}
