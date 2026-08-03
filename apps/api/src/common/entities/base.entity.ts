import {
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TIMESTAMP } from '../../database/column-types';

/**
 * Columnas comunes a todas las entidades de dominio.
 * Las tablas de Better Auth (user, session, account, verification) NO heredan
 * de aquí: las gestiona Better Auth con su propio esquema.
 */
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMP })
  updatedAt: Date;

  /** Borrado lógico: `softRemove()` lo rellena en vez de borrar la fila. */
  @DeleteDateColumn({ name: 'deleted_at', type: TIMESTAMP, nullable: true })
  deletedAt: Date | null;
}
