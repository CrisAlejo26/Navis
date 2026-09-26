/** Sin sesión (modo local) las preferencias son de «nadie en particular». */
export const LOCAL_USER_ID = 'local';

const TABLE_STORAGE_PREFIX = 'navis.table';

/**
 * Lleva el usuario: en un equipo compartido las columnas de una persona no son
 * las de otra. No lleva la iglesia: son preferencias de quien mira.
 */
export function tablePreferencesKey(userId: string, tableId: string): string {
    return `${TABLE_STORAGE_PREFIX}.${userId}.${tableId}.prefs`;
}
