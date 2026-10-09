import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP } from '../database/column-types';

/**
 * Token de vinculación: de un solo uso y con caducidad corta. Solo se guarda su
 * huella SHA-256, así que un volcado de la base de datos no sirve para vincular.
 */
@Entity({ name: 'device_links' })
export class DeviceLink extends BaseEntity {
    @Index('IDX_device_links_user_id')
    @Column({ name: 'user_id', type: 'text' })
    userId: string;

    @Index('UQ_device_links_token_hash', { unique: true })
    @Column({ name: 'token_hash', type: 'varchar', length: 64 })
    tokenHash: string;

    @Column({ name: 'expires_at', type: TIMESTAMP })
    expiresAt: Date;

    @Column({ name: 'consumed_at', type: TIMESTAMP, nullable: true })
    consumedAt: Date | null;
}
