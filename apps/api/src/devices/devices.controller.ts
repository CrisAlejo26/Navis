import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    Param,
    ParseUUIDPipe,
    Post,
    Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
    DEVICE_LINK_TTL_MINUTES,
    SYNC_PROTOCOL_VERSION,
    type Device,
    type DeviceCredential,
    type DeviceLink,
    type SyncCapabilities,
} from '@navis/shared';
import type { Request } from 'express';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { env } from '../config/env';
import { DevicesService } from './devices.service';
import { ExchangeDeviceLinkDto } from './dto/exchange-device-link.dto';

const INSTALLATION_NAME = 'Navis';

@ApiTags('dispositivos')
@Controller()
export class DevicesController {
    constructor(private readonly devices: DevicesService) {}

    @Public()
    @Get('sync/capabilities')
    @ApiOperation({ summary: 'Qué servidor es y qué protocolo habla, antes de vincular' })
    capabilities(): SyncCapabilities {
        return {
            installationName: INSTALLATION_NAME,
            protocolVersion: SYNC_PROTOCOL_VERSION,
            dataSyncEnabled: env.SYNC_ENABLED,
            linkTtlMinutes: DEVICE_LINK_TTL_MINUTES,
        };
    }

    @Post('device-links')
    @ApiOperation({ summary: 'Genera un token de vinculación de un solo uso' })
    async createLink(@CurrentUser() user: AuthUser, @Req() request: Request): Promise<DeviceLink> {
        // Un dispositivo vinculado no puede vincular más: eso se hace desde una sesión.
        if (request.deviceId) throw new ForbiddenException('Vincula desde una sesión de la web');
        const { token, expiresAt } = await this.devices.createLink(user.id);
        return {
            token,
            expiresAt,
            apiUrl: `${env.BETTER_AUTH_URL}/${env.API_PREFIX}/v${env.API_VERSION}`,
            installationName: INSTALLATION_NAME,
            accountEmail: user.email,
        };
    }

    @Public()
    @Throttle({ default: { limit: 60, ttl: 60_000 } })
    @Post('device-links/exchange')
    @HttpCode(200)
    @ApiOperation({ summary: 'Canjea el token por la credencial del dispositivo' })
    exchange(@Body() dto: ExchangeDeviceLinkDto): Promise<DeviceCredential> {
        return this.devices.exchange(dto.token, dto.deviceName);
    }

    @Get('devices')
    @ApiOperation({ summary: 'Dispositivos vinculados a la cuenta' })
    list(@CurrentUser('id') userId: string, @Req() request: Request): Promise<Device[]> {
        return this.devices.list(userId, request.deviceId);
    }

    @Delete('devices/:id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Revoca un dispositivo' })
    revoke(
        @CurrentUser('id') userId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<void> {
        return this.devices.revoke(userId, id);
    }
}
