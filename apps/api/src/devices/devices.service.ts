import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    DEVICE_LINK_TTL_MINUTES,
    type Device as DeviceView,
    type DeviceCredential,
} from '@navis/shared';
import { IsNull, Repository } from 'typeorm';

import type { AuthUser } from '../auth/auth';
import { AuthService } from '../auth/auth.service';
import { Device } from './device.entity';
import { DeviceLink } from './device-link.entity';
import { hashSecret, newDeviceCredential, newLinkToken } from './device-secrets';

/** `last_seen_at` no se reescribe en cada petición: con una al minuto basta. */
const SEEN_REFRESH_MS = 60_000;

const toView = (device: Device, currentId?: string): DeviceView => ({
    id: device.id,
    name: device.name,
    createdAt: device.createdAt,
    lastSeenAt: device.lastSeenAt,
    current: device.id === currentId,
});

@Injectable()
export class DevicesService {
    constructor(
        @InjectRepository(DeviceLink) private readonly links: Repository<DeviceLink>,
        @InjectRepository(Device) private readonly devices: Repository<Device>,
        private readonly auth: AuthService,
    ) {}

    async createLink(userId: string): Promise<{ token: string; expiresAt: Date }> {
        const token = newLinkToken();
        const expiresAt = new Date(Date.now() + DEVICE_LINK_TTL_MINUTES * 60_000);
        await this.links.save(
            this.links.create({
                userId,
                tokenHash: hashSecret(token),
                expiresAt,
                consumedAt: null,
            }),
        );
        return { token, expiresAt };
    }

    /**
     * Canjea el token. Se marca como usado ANTES de comprobar nada más con un
     * UPDATE condicionado: dos canjes simultáneos del mismo token no pueden
     * ganar los dos, y uno caducado queda inservible igualmente.
     */
    async exchange(token: string, deviceName: string): Promise<DeviceCredential> {
        const tokenHash = hashSecret(token);
        const claimed = await this.links.update(
            { tokenHash, consumedAt: IsNull() },
            { consumedAt: new Date() },
        );
        const link = claimed.affected === 1 ? await this.links.findOneBy({ tokenHash }) : null;
        if (!link || link.expiresAt.getTime() < Date.now()) {
            throw new ForbiddenException('El código de vinculación no es válido o ha caducado');
        }

        const user = await this.findUser(link.userId);
        if (!user) throw new ForbiddenException('La cuenta ya no existe');

        const credential = newDeviceCredential();
        const device = await this.devices.save(
            this.devices.create({
                userId: user.id,
                name: deviceName,
                credentialHash: hashSecret(credential),
                lastSeenAt: new Date(),
                revokedAt: null,
            }),
        );
        return {
            credential,
            device: toView(device, device.id),
            account: { id: user.id, name: user.name, email: user.email },
        };
    }

    async list(userId: string, currentId?: string): Promise<DeviceView[]> {
        const rows = await this.devices.find({
            where: { userId, revokedAt: IsNull() },
            order: { createdAt: 'DESC' },
        });
        return rows.map((row) => toView(row, currentId));
    }

    async revoke(userId: string, id: string): Promise<void> {
        const result = await this.devices.update(
            { id, userId, revokedAt: IsNull() },
            { revokedAt: new Date() },
        );
        if (result.affected !== 1) throw new NotFoundException('Dispositivo no encontrado');
    }

    /** Usuario y dispositivo de una credencial vigente, o `null` si no existe o está revocada. */
    async resolveCredential(
        credential: string,
    ): Promise<{ user: AuthUser; deviceId: string } | null> {
        const device = await this.devices.findOneBy({
            credentialHash: hashSecret(credential),
            revokedAt: IsNull(),
        });
        if (!device) return null;
        const user = await this.findUser(device.userId);
        if (!user) return null;

        const seen = device.lastSeenAt?.getTime() ?? 0;
        if (Date.now() - seen > SEEN_REFRESH_MS) {
            await this.devices.update({ id: device.id }, { lastSeenAt: new Date() });
        }
        return { user, deviceId: device.id };
    }

    private async findUser(id: string): Promise<AuthUser | null> {
        const context = await this.auth.instance.$context;
        return (await context.internalAdapter.findUserById(id)) as AuthUser | null;
    }
}
