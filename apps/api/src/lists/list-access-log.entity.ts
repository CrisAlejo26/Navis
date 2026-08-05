import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ListAccessOutcome } from '@navis/shared';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Un **intento** de entrar en una lista restringida (RFC 0010 §6.6, D27).
 *
 * Cada intento —bueno o malo— se apunta con su resultado, y la ficha lo enseña:
 * veinte fallos seguidos desde un sitio son una noticia. Es lo que permite
 * frenar el **origen** en vez de bloquear la cuenta, que sería un regalo:
 * cualquiera con el enlace podría dejar fuera a los ancianos fallando cinco
 * veces a propósito.
 *
 * **Aquí no se guarda la contraseña tecleada**, ni acertada ni fallada, ni su
 * longitud: lo único que se apunta es que hubo un intento y cómo acabó.
 */
@Entity('list_access_log')
@Index('IDX_list_access_log_recent', ['listId', 'at'])
export class ListAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'list_id', type: UUID })
  listId: string;

  @ApiPropertyOptional({ description: 'Nulo cuando el usuario ni existe' })
  @Column({ name: 'viewer_id', type: UUID, nullable: true })
  viewerId: string | null;

  @ApiProperty({ description: 'Lo que se tecleó, para poder leer el registro' })
  @Column({ type: 'text' })
  username: string;

  @ApiProperty({ description: 'ok | bad_credentials | no_grant | throttled' })
  @Column({ type: 'text' })
  outcome: ListAccessOutcome;

  @ApiProperty({ description: 'Nunca la IP entera (D32)' })
  @Column({ name: 'ip_prefix', type: 'text', default: '' })
  ipPrefix: string;

  @ApiProperty()
  @Column({ type: TIMESTAMP })
  at: Date;
}
