import {
    journalWindowStart,
    toSearchName,
    type EntryKind,
    type JournalQuery,
    type JournalSortField,
    type JournalWindow,
} from '@navis/shared';
import type { SelectQueryBuilder } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import type { JournalEntry } from './journal-entry.entity';

/** Por qué columna ordena cada campo del listado (§6.1). */
const SORT_SQL: Record<JournalSortField, string> = {
    date: 'entry.occurredAt',
    title: 'entry.title',
    kind: 'entry.kind',
};

/** El primer día de la ventana, o `null` si es «todo» (D9). */
export function windowStart(window: JournalWindow, today: string): string | null {
    return journalWindowStart(window, today);
}

/**
 * Búsqueda, tipo, ventana y recordatorio pendiente, sobre un constructor ya
 * acotado a la iglesia activa.
 */
export function applyFilters(
    builder: SelectQueryBuilder<JournalEntry>,
    query: JournalQuery,
    today: string,
): void {
    if (query.search?.trim()) {
        builder.andWhere("entry.searchText LIKE :search ESCAPE '\\'", {
            // La misma normalización con la que se guardó, o dejaría de encontrar.
            search: `%${toSearchName(query.search.trim()).replace(/[\\%_]/g, '\\$&')}%`,
        });
    }

    const kinds: readonly EntryKind[] = query.kind ?? [];
    if (kinds.length > 0) builder.andWhere('entry.kind IN (:...kinds)', { kinds: [...kinds] });

    const from = query.from ?? windowStart(query.window ?? 'all', today);
    if (from) builder.andWhere('entry.occurredAt >= :from', { from });
    if (query.to) builder.andWhere('entry.occurredAt <= :to', { to: query.to });
    else if (query.window && query.window !== 'all')
        builder.andWhere('entry.occurredAt <= :today', { today });

    // «Sin atender», no «vencido»: un recordatorio puesto para mañana sigue
    // pendiente aunque todavía no toque. Que ya haya vencido es un cálculo de
    // presentación (`isEntryReminderDue`), no un filtro del listado.
    if (query.pendingReminder) {
        builder.andWhere('entry.remindAt IS NOT NULL').andWhere('entry.remindDoneAt IS NULL');
    }
}

/**
 * El orden, con el desempate por identificador.
 *
 * Sin él, dos entradas del mismo día pueden salir en distinto orden en dos
 * páginas seguidas y una de ellas se repetiría mientras otra desaparece.
 */
export function applyOrder(
    builder: SelectQueryBuilder<JournalEntry>,
    sort: JournalSortField,
    order: 'asc' | 'desc',
): void {
    const direction = order === 'asc' ? 'ASC' : 'DESC';
    // `NULLS FIRST` no existe en SQLite: la cláusula se pone solo en Postgres.
    builder.orderBy(
        sort === 'title' ? 'LOWER(entry.title)' : SORT_SQL[sort],
        direction,
        nullsFor(direction),
    );
    builder.addOrderBy('entry.id', direction);
}
