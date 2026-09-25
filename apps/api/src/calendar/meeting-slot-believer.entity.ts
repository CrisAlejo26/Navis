import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { MeetingSlot } from './meeting-slot.entity';

/**
 * Una persona en una fase. Una fase admite a cuantas hagan falta (RFC 0002 D1
 * sigue en pie: la unidad es la fase, aquí solo cambia quién la ocupa).
 *
 * `position` guarda el orden en que se eligieron: un `IN (...)` no lo garantiza
 * y es el orden con el que se enseñan los nombres en el cartel.
 *
 * `believer_id` va **sin clave ajena**, como en las filas de las tablas
 * vinculadas: el borrado de creyentes es lógico y lo asignado sigue contando en
 * el historial. Las filas son de verdad, no lógicas: quitar a alguien de una
 * fase es borrar su fila.
 */
@Entity('meeting_slot_believers')
@Index('IDX_meeting_slot_believers_slot', ['slotId', 'position'])
@Index('IDX_meeting_slot_believers_believer', ['believerId'])
export class MeetingSlotBeliever extends BaseEntity {
    @ApiProperty()
    @Column({ name: 'slot_id', type: UUID })
    slotId: string;

    /* Por nombre y con `Relation<>`, para no cerrar el ciclo padre-hijo al
     cargar los módulos (ver `pattern-phase.entity.ts`). */
    @ManyToOne('MeetingSlot', 'people', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'slot_id' })
    slot: Relation<MeetingSlot>;

    @ApiProperty()
    @Column({ name: 'believer_id', type: UUID })
    believerId: string;

    @ApiProperty({ description: 'Orden dentro de la fase, empezando en 0' })
    @Column({ type: 'int' })
    position: number;
}
