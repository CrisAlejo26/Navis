import { isPostgres } from './column-types';
import { BELIEVER_NUMERIC_FIELDS, type TableBelieverField } from '@navis/shared';

/**
 * El valor de un campo del creyente, como expresión SQL sobre el alias `b`
 * (RFC 0025 D12). Es la pareja de `json-field-sql.ts` para el otro lado del
 * enlace: mismo problema de dos motores, mismo sitio.
 *
 * Dos cuidados de motor:
 * - `arrived_at` y `last_note_at` son columnas `date` de verdad en Postgres,
 *   y el texto ISO es lo que se compara y ordena: se vuelven texto con
 *   `::text` (la trampa del día anterior vive en `iso-day.ts`).
 * - El nombre de la sede vive en otra tabla: es una subconsulta por el
 *   `congregation_id`.
 */
const FIELD_SQL: Record<TableBelieverField, string> = {
    // `TRIM` porque el `lastName` vacío dejaría un espacio al final, y el
    // overlay en TypeScript (`believerName`) sí lo recorta.
    fullName: "TRIM(b.first_name || ' ' || b.last_name)",
    firstName: 'b.first_name',
    lastName: 'b.last_name',
    phone: 'b.phone',
    email: 'b.email',
    status: 'b.status',
    congregation: '(SELECT c.name FROM congregations c WHERE c.id = b.congregation_id)',
    arrivedAt: isPostgres ? 'b.arrived_at::text' : 'b.arrived_at',
    lastNoteAt: isPostgres ? 'b.last_note_at::text' : 'b.last_note_at',
    arrivalSite: 'b.arrival_site',
    bibleReadings: 'b.bible_readings',
    vivenciasReadings: 'b.vivencias_readings',
    bibleInstituteTimes: 'b.bible_institute_times',
};

/** La expresión del campo, con el alias `believers b` ya puesto. */
export function believerFieldExpr(field: TableBelieverField): string {
    return FIELD_SQL[field];
}

/**
 * Ordenar por una columna vinculada: subconsulta escalar correlacionada en el
 * `ORDER BY` (D12). La consulta de la página sigue tocando solo
 * `custom_table_rows` en el `FROM` — sin `JOIN`, la trampa de `take`/`skip`
 * con `DISTINCT` en Postgres no llega a plantearse (D18 de la RFC 0021).
 */
export function believerFieldOrderExpr(field: TableBelieverField, rowAlias = 'row'): string {
    const value = believerFieldExpr(field);
    const sub = `(SELECT ${value} FROM believers b WHERE b.id = ${rowAlias}.believer_id AND b.deleted_at IS NULL)`;
    if (!BELIEVER_NUMERIC_FIELDS.includes(field)) return sub;

    // Los campos numéricos ya son `int` en la columna: el `CAST` solo
    // normaliza — y sin él, en SQLite un `int` también ordena bien, pero el
    // `NULLIF(x, '')` de la familia de JSON se rompe aquí: contra un `int` de
    // Postgres no se puede comparar con un texto.
    return isPostgres ? `(${sub})::numeric` : `CAST(${sub} AS REAL)`;
}

/** La cláusula `EXISTS` que condiciona contra el creyente de la fila (D12). */
export function believerFieldExists(condition: string, rowAlias = 'row'): string {
    return `(EXISTS (SELECT 1 FROM believers b WHERE b.id = ${rowAlias}.believer_id AND b.deleted_at IS NULL AND ${condition}))`;
}

/**
 * Buscar en el creyente de la fila (D12): el `LIKE` del JSON de la fila **o**
 * el término contra sus campos de texto. Buscar a «Juan» tiene que
 * encontrarlo aunque el nombre venga de una columna vinculada.
 */
export function believerSearchExpr(searchParam: string, rowAlias = 'row'): string {
    const campos = ['first_name', 'last_name', 'search_name'].map(
        (one) => `LOWER(b.${one}) LIKE LOWER(:${searchParam})`,
    );
    campos.push(`LOWER(COALESCE(b.phone, '')) LIKE LOWER(:${searchParam})`);
    campos.push(`LOWER(COALESCE(b.email, '')) LIKE LOWER(:${searchParam})`);
    return believerFieldExists(`(${campos.join(' OR ')})`, rowAlias);
}
