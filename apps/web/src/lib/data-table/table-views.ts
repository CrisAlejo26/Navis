import type { TableFilter, TableSort } from '@navis/shared';

import { MAX_SAVED_VIEWS, type SavedTableView } from './table-preferences';

/** Lo que define una vista: todo lo que la persona ha puesto a la tabla, salvo el tamaño de página. */
export interface ViewSnapshot {
    filters: readonly TableFilter[];
    sorts: readonly TableSort[];
    columnVisibility: Readonly<Record<string, boolean>>;
    columnOrder: readonly string[];
}

/** Una clave estable para comparar dos estados sin depender del orden de las claves de un objeto. */
function keyOf(snapshot: ViewSnapshot): string {
    return JSON.stringify([
        snapshot.filters,
        snapshot.sorts,
        Object.entries(snapshot.columnVisibility).sort(([a], [b]) => a.localeCompare(b)),
        snapshot.columnOrder,
    ]);
}

/** La vista con la que coincide el estado actual, si alguna: sirve para marcarla como activa. */
export function activeView(
    views: readonly SavedTableView[],
    current: ViewSnapshot,
): SavedTableView | undefined {
    const key = keyOf(current);
    return views.find((view) => keyOf(view) === key);
}

/**
 * Añade una vista con el estado actual. Sin nombre no hay vista; con el nombre
 * de otra que ya existe, **la sustituye** (guardar dos veces «Pendientes» no debe
 * dejar dos). Al llegar al tope no se guarda: el llamador lo dice.
 */
export function withSavedView(
    views: readonly SavedTableView[],
    name: string,
    current: ViewSnapshot,
    newId: () => string,
): SavedTableView[] | null {
    const clean = name.trim().slice(0, 60);
    if (!clean) return null;

    const same = views.find((view) => view.name.toLowerCase() === clean.toLowerCase());
    if (!same && views.length >= MAX_SAVED_VIEWS) return null;

    const saved: SavedTableView = {
        id: same?.id ?? newId(),
        name: clean,
        filters: [...current.filters],
        sorts: [...current.sorts],
        columnVisibility: { ...current.columnVisibility },
        columnOrder: [...current.columnOrder],
    };
    return same ? views.map((view) => (view.id === same.id ? saved : view)) : [...views, saved];
}
