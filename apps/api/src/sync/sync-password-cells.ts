import type { DataSource } from 'typeorm';

import { decryptTableField, isEncryptedTableField } from '../tables/table-field-crypto';

/**
 * Las celdas de tipo contraseña se guardan cifradas con una clave **del
 * servidor** (RFC 0021 D21), que el teléfono no tiene. El móvil cifra las suyas
 * con una clave **del aparato**. Ninguna de las dos se puede leer en el otro
 * lado, así que el protocolo no lleva sobres: viaja el texto claro, solo por
 * HTTPS y solo a quien ya tiene `tables.view` (el mismo permiso del endpoint
 * `reveal`), y cada extremo vuelve a cifrar con su propia clave al guardar.
 * Es la política de la Fase 3: nada de subir sobres que solo entiende un móvil.
 */
export async function revealRowData(
    dataSource: DataSource,
    tableId: string,
    dataText: string,
): Promise<string> {
    let data: unknown;
    try {
        data = JSON.parse(dataText);
    } catch {
        return dataText;
    }
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return dataText;

    const marker = dataSource.options.type === 'postgres' ? '$1' : '?';
    const found: unknown = await dataSource.query(
        `SELECT key FROM custom_table_columns WHERE table_id = ${marker} AND type = 'password'`,
        [tableId],
    );
    const keys = Array.isArray(found)
        ? (found as { key: string }[]).map((column) => column.key)
        : [];

    const revealed: Record<string, unknown> = { ...(data as Record<string, unknown>) };
    for (const key of keys) {
        const value = revealed[key];
        if (isEncryptedTableField(value)) revealed[key] = decryptTableField(value);
    }
    return JSON.stringify(revealed);
}
