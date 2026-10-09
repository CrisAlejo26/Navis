import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP } from '../database/column-types';

/**
 * Un teléfono vinculado a una cuenta. La credencial es propia del dispositivo
 * (no una sesión de Better Auth ni una clave compartida): revocarla bloquea solo
 * a este aparato. Se guarda su huella, nunca el valor.
 */
@Entity({ name: 'devices' })
export class Device extends BaseEntity {
    @Index('IDX_devices_user_id')
    @Column({ name: 'user_id', type: 'text' })
    userId: string;

    @Column({ type: 'varchar', length: 80 })
    name: string;

    @Index('UQ_devices_credential_hash', { unique: true })
    @Column({ name: 'credential_hash', type: 'varchar', length: 64 })
    credentialHash: string;

    @Column({ name: 'last_seen_at', type: TIMESTAMP, nullable: true })
    lastSeenAt: Date | null;

    @Column({ name: 'revoked_at', type: TIMESTAMP, nullable: true })
    revokedAt: Date | null;
}
