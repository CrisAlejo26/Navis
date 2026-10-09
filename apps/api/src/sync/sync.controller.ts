import { BadRequestException, Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
    syncChangesQuerySchema,
    syncOperationsRequestSchema,
    type SyncChangesPage,
    type SyncOperationResult,
} from '@navis/shared';
import type { Request } from 'express';
import type { ZodType } from 'zod';

import type { AuthUser } from '../auth/auth';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SyncChangesService } from './sync-changes.service';
import { SyncOperationsService } from './sync-operations.service';

/** Valida con el esquema compartido; el formato del error es el de cualquier otra validación. */
function parse<T>(schema: ZodType<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (result.success) return result.data;
    throw new BadRequestException({
        message: 'Petición de sincronización no válida',
        details: result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    });
}

@ApiTags('sincronización')
@Controller('sync')
export class SyncController {
    constructor(
        private readonly changes: SyncChangesService,
        private readonly operations: SyncOperationsService,
    ) {}

    @Get('changes')
    @ApiOperation({
        summary: 'Cambios publicados desde un cursor, filtrados por lo que ve la cuenta',
    })
    getChanges(
        @CurrentUser() user: AuthUser,
        @Query() query: Record<string, unknown>,
    ): Promise<SyncChangesPage> {
        return this.changes.page(user, parse(syncChangesQuerySchema, query));
    }

    @Post('operations')
    @ApiOperation({ summary: 'Operaciones idempotentes del cliente' })
    async postOperations(
        @CurrentUser() user: AuthUser,
        @Req() request: Request,
        @Body() body: unknown,
    ): Promise<{ results: SyncOperationResult[] }> {
        this.changes.assertEnabled();
        const { operations } = parse(syncOperationsRequestSchema, body);
        // El recibo es del dispositivo; sin dispositivo (sesión de la web), de la cuenta.
        const deviceKey = request.deviceId ?? `user:${user.id}`;
        return { results: await this.operations.apply(deviceKey, user, operations) };
    }
}
