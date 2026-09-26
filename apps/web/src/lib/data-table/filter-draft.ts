import type { TableColumnKind, TableOperator } from '@navis/shared';

/**
 * Lo que hay escrito en el formulario de un filtro, como texto, antes de ser un
 * valor. Existe porque un campo numérico a medias (`1.`, `-`) no es todavía un
 * número, y convertirlo en cada pulsación cambiaría lo que la persona ve teclear.
 */
export interface FilterDraft {
    a: string;
    b: string;
    list: string[];
    flag: boolean | null;
}

export const EMPTY_DRAFT: FilterDraft = { a: '', b: '', list: [], flag: null };

const num = (text: string): number | undefined => {
    if (text.trim() === '') return undefined;
    const value = Number(text);
    return Number.isFinite(value) ? value : undefined;
};

const text = (value: unknown): string =>
    typeof value === 'string' ? value : typeof value === 'number' ? String(value) : '';

const field = (value: unknown, key: string): string =>
    typeof value === 'object' && value !== null
        ? text((value as Record<string, unknown>)[key])
        : '';

/** El valor que representa el formulario, o `undefined` si aún está a medias. */
export function valueFromDraft(
    kind: TableColumnKind,
    operator: TableOperator,
    draft: FilterDraft,
): unknown {
    if (kind === 'boolean') return draft.flag ?? undefined;
    if (kind === 'select') return draft.list.length > 0 ? draft.list : undefined;
    if (operator === 'between') {
        return kind === 'date'
            ? { from: draft.a || undefined, to: draft.b || undefined }
            : { min: num(draft.a), max: num(draft.b) };
    }
    if (kind === 'number') return num(draft.a);
    return draft.a.trim() === '' ? undefined : draft.a.trim();
}

/** Lo contrario: cargar en el formulario un filtro que ya existe (de la URL, p. ej.). */
export function draftFromValue(
    kind: TableColumnKind,
    operator: TableOperator,
    value: unknown,
): FilterDraft {
    if (kind === 'boolean')
        return { ...EMPTY_DRAFT, flag: typeof value === 'boolean' ? value : null };
    if (kind === 'select') {
        const list = Array.isArray(value)
            ? (value as unknown[]).filter((v): v is string => typeof v === 'string')
            : [];
        return { ...EMPTY_DRAFT, list };
    }
    if (operator === 'between') {
        return kind === 'date'
            ? { ...EMPTY_DRAFT, a: field(value, 'from'), b: field(value, 'to') }
            : { ...EMPTY_DRAFT, a: field(value, 'min'), b: field(value, 'max') };
    }
    return { ...EMPTY_DRAFT, a: text(value) };
}
