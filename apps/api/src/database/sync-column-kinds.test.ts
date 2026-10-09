import { ALL_LOCAL_TABLES, columnKind, type ColumnKind } from '@navis/shared';
import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';

import { dataSourceOptions } from './data-source';

/**
 * El tipo semántico de las columnas de texto (día, hora, instante, JSON) que
 * declara `@navis/shared` tiene que ser el mismo que tienen las entidades de
 * TypeORM. Si una columna pasa de `date` a `timestamptz` en la API y la tabla
 * del móvil no se entera, el protocolo convertiría un día en un instante.
 */
function entityKind(type: unknown): ColumnKind | undefined {
    const name = typeof type === 'string' ? type : '';
    if (name === 'simple-json') return 'json';
    if (name === 'date') return 'day';
    if (name === 'time') return 'time';
    if (name === 'datetime' || name === 'timestamptz') return 'instant';
    return undefined;
}

describe('tipos semánticos de columna local ↔ TypeORM', () => {
    const storage = getMetadataArgsStorage();
    const entities = (dataSourceOptions.entities ?? []) as (new () => object)[];

    for (const table of ALL_LOCAL_TABLES) {
        const entity = entities.find(
            (one) => storage.tables.find((t) => t.target === one)?.name === table.name,
        );
        if (!entity) continue;

        it(`${table.name}: cada columna significa lo mismo en los dos lados`, () => {
            const declared = new Map(
                storage.columns
                    .filter((column) => column.target === entity)
                    .map((column) => [
                        String(column.options.name ?? column.propertyName),
                        entityKind(column.options.type),
                    ]),
            );
            const wrong: string[] = [];
            for (const [column, kind] of declared) {
                if (kind !== columnKind(table.name, column)) {
                    wrong.push(
                        `${column}: api=${String(kind)} shared=${String(columnKind(table.name, column))}`,
                    );
                }
            }
            expect(wrong).toEqual([]);
        });
    }
});
