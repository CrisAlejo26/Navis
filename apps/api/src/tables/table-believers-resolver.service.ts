import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { Congregation } from '../calendar/congregation.entity';

export interface ResolvedBeliever {
    believer: Believer;
    congregationName: string | null;
}

/**
 * El creyente de cada fila, con el nombre de su sede (RFC 0025 D11). Lo usan la
 * página y la exportación: las dos tienen que pintar lo mismo.
 *
 * Devuelve una entrada por fila, en su orden; `null` si la fila no lleva
 * creyente o ya no está en el catálogo de la iglesia (borrado o trasladado).
 */
@Injectable()
export class TableBelieversResolver {
    constructor(
        @InjectRepository(Believer) private readonly believers: Repository<Believer>,
        @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    ) {}

    async resolve(
        rows: readonly { believerId: string | null }[],
        churchId: string,
    ): Promise<(ResolvedBeliever | null)[]> {
        const ids = [
            ...new Set(rows.map((one) => one.believerId).filter((one): one is string => !!one)),
        ];
        if (ids.length === 0) return rows.map(() => null);

        const found = await this.believers.find({ where: { id: In(ids), churchId } });
        const siteIds = [
            ...new Set(
                found.map((one) => one.congregationId).filter((one): one is string => !!one),
            ),
        ];
        const sites =
            siteIds.length > 0 ? await this.congregations.find({ where: { id: In(siteIds) } }) : [];

        const byId = new Map(found.map((one) => [one.id, one]));
        const siteNames = new Map(sites.map((one) => [one.id, one.name]));

        return rows.map((row) => {
            const believer = byId.get(row.believerId ?? '');
            if (!believer) return null;

            return {
                believer,
                congregationName: believer.congregationId
                    ? (siteNames.get(believer.congregationId) ?? null)
                    : null,
            };
        });
    }
}
