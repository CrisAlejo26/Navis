import type { Backup } from './backup-format';
import { upgradeLegacyTables } from './legacy-tables';

// Protege las copias hechas antes del esquema 15: llevan `deleted_at` en columnas
// y vistas, que ya no existe, y sin esta traducción la restauración las rechazaría.
it('traduce una copia antigua al modelo de la API', () => {
    const backup = {
        tables: {
            custom_table_columns: [
                { id: 'c1', is_active: 1, deleted_at: null },
                { id: 'c2', is_active: 1, deleted_at: '2026-01-01' },
            ],
            custom_table_views: [
                { id: 'v1', deleted_at: null },
                { id: 'v2', deleted_at: '2026-01-01' },
            ],
        },
    } as unknown as Backup; // doble de test: solo lleva las dos tablas que se comprueban

    upgradeLegacyTables(backup);

    expect(backup.tables.custom_table_columns).toEqual([
        { id: 'c1', is_active: 1 },
        { id: 'c2', is_active: 0 },
    ]);
    expect(backup.tables.custom_table_views).toEqual([{ id: 'v1' }]);
});
