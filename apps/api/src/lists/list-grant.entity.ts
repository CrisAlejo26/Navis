import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Qué acceso abre qué lista (RFC 0010 D19, §6.4).
 *
 * **Es la única tabla que decide si alguien puede leer una lista restringida**,
 * y se consulta en cada petición (D23). Por eso es de dos columnas y sin
 * lógica: lo que se pregunta mil veces al día tiene que ser una búsqueda por
 * clave primaria.
 *
 * Las listas y los accesos se borran **lógicamente**, así que el `ON DELETE
 * CASCADE` no se dispara: al borrar cualquiera de los dos, el servicio quita
 * sus concesiones a mano y en la misma transacción. Una concesión huérfana no
 * abriría nada, pero saldría contada en «a cuántas listas llega este acceso»,
 * que es justo el número que se mira para decidir.
 */
@Entity('list_grants')
export class ListGrant {
  @ApiProperty()
  @PrimaryColumn({ name: 'viewer_id', type: UUID })
  viewerId: string;

  @ApiProperty()
  @Index('IDX_list_grants_list')
  @PrimaryColumn({ name: 'list_id', type: UUID })
  listId: string;

  @CreateDateColumn({ name: 'granted_at', type: TIMESTAMP })
  grantedAt: Date;

  /** El identificador de Better Auth es texto, no uuid (ver `CreateProfiles`). */
  @Column({ name: 'granted_by', type: 'text' })
  grantedBy: string;
}
