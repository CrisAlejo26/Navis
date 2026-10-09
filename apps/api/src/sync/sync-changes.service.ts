import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { SyncChange as WireChange, SyncChangesPage, SyncChangesQuery } from '@navis/shared';
import { Brackets, DataSource, Repository } from 'typeorm';

import { ChurchMember } from '../churches/church-member.entity';
import { env } from '../config/env';
import { SyncChange } from './sync-change.entity';
import { SyncInstallationService } from './sync-installation.service';
import { SyncPublisher } from './sync-publisher.service';
import { readWireRow } from './sync-row-reader';

/**
 * Descarga incremental. Un cambio solo se entrega si lo puede ver la cuenta:
 *   · sin iglesia ni dueño (catálogos): todos;
 *   · con dueño y sin iglesia (profecías, sueños…): solo ese dueño;
 *   · con iglesia: sus miembros, y si además tiene dueño (tareas, cuaderno…),
 *     solo ese dueño.
 * Es la barrera mínima del registro; los permisos por módulo se aplican en los
 * adaptadores de la Fase 8, y por eso la sincronización sigue tras `SYNC_ENABLED`.
 */
@Injectable()
export class SyncChangesService {
    constructor(
        @InjectRepository(SyncChange) private readonly changes: Repository<SyncChange>,
        @InjectRepository(ChurchMember) private readonly members: Repository<ChurchMember>,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly publisher: SyncPublisher,
        private readonly installation: SyncInstallationService,
    ) {}

    assertEnabled(): void {
        if (!env.SYNC_ENABLED) throw new ForbiddenException('La sincronización no está activada');
    }

    async page(userId: string, query: SyncChangesQuery): Promise<SyncChangesPage> {
        this.assertEnabled();
        const generation = await this.installation.generation();
        if (query.generation && query.generation !== generation) {
            throw new ConflictException('La instalación cambió: hay que volver a descargar');
        }

        await this.publisher.publish();
        const top = await this.changes
            .createQueryBuilder('change')
            .select('MAX(change.position)', 'max')
            .getRawOne<{ max: number | string | null }>();
        if (query.cursor > Number(top?.max ?? 0)) {
            throw new ConflictException(
                'El cursor es posterior al servidor: hay que volver a descargar',
            );
        }

        const churches = (
            await this.members.find({ where: { userId }, select: { churchId: true } })
        ).map((member) => member.churchId);

        const builder = this.changes
            .createQueryBuilder('change')
            .where('change.position > :cursor', { cursor: query.cursor })
            .andWhere(
                new Brackets((visible) => {
                    visible
                        .where('change.churchId IS NULL AND change.ownerId IS NULL')
                        .orWhere('change.churchId IS NULL AND change.ownerId = :userId', {
                            userId,
                        });
                    if (churches.length > 0) {
                        visible.orWhere(
                            'change.churchId IN (:...churches) AND (change.ownerId IS NULL OR change.ownerId = :userId)',
                            { churches, userId },
                        );
                    }
                }),
            )
            .orderBy('change.position', 'ASC')
            .limit(query.limit + 1);

        const found = await builder.getMany();
        const hasMore = found.length > query.limit;
        const page = hasMore ? found.slice(0, query.limit) : found;

        const changes: WireChange[] = [];
        for (const change of page) {
            const row =
                change.op === 'upsert'
                    ? await readWireRow(this.dataSource, change.tableName, change.entityId)
                    : null;
            changes.push({
                position: change.position ?? 0,
                table: change.tableName,
                id: change.entityId,
                // Si la fila ya no está (borrada después), el cliente recibe el borrado.
                op: row ? 'upsert' : 'delete',
                revision: change.revision,
                row,
            });
        }

        // Sin más páginas, todo lo publicado hasta la posición máxima ya se ha considerado, también lo que
        // esta cuenta no ve: el cursor salta ese tramo y no lo vuelve a escanear.
        const last = page[page.length - 1];
        const published = Number(top?.max ?? 0);
        return {
            generation,
            changes,
            nextCursor: hasMore
                ? (last?.position ?? query.cursor)
                : Math.max(published, query.cursor),
            hasMore,
        };
    }
}
