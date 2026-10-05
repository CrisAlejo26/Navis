import type { LocalColumn, LocalTable } from './local-schema';

const base: LocalColumn[] = [
    { name: 'id', type: 'text', pk: true },
    { name: 'created_at', type: 'text' },
    { name: 'updated_at', type: 'text' },
    { name: 'deleted_at', type: 'text', nullable: true },
];
/** Columnas y vistas no llevan `deleted_at` en la API: las columnas se desactivan con `is_active` y las vistas se borran de verdad. */
const baseWithoutDelete: LocalColumn[] = base.filter((one) => one.name !== 'deleted_at');
export const LOCAL_CUSTOM_TABLES: LocalTable[] = [
    {
        name: 'custom_tables',
        mirror: 'CustomTable',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'slug', type: 'text' },
            { name: 'icon', type: 'text' },
            { name: 'accent', type: 'text', default: 'primary' },
            { name: 'position', type: 'int', default: 0 },
            { name: 'is_active', type: 'bool', default: true },
            { name: 'source', type: 'text', nullable: true },
            { name: 'created_by', type: 'text', nullable: true },
        ],
    },
    {
        name: 'custom_table_columns',
        mirror: 'CustomTableColumn',
        columns: [
            ...baseWithoutDelete,
            { name: 'table_id', type: 'text' },
            { name: 'key', type: 'text' },
            { name: 'label', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'position', type: 'int' },
            { name: 'required', type: 'bool', default: false },
            { name: 'options', type: 'text', nullable: true },
            { name: 'config', type: 'text', nullable: true },
            { name: 'is_active', type: 'bool', default: true },
            { name: 'believer_field', type: 'text', nullable: true },
        ],
    },
    {
        name: 'custom_table_rows',
        mirror: 'CustomTableRow',
        columns: [
            ...base,
            { name: 'table_id', type: 'text' },
            { name: 'data', type: 'text', default: '{}' },
            { name: 'believer_id', type: 'text', nullable: true },
            { name: 'created_by', type: 'text', nullable: true },
        ],
    },
    {
        name: 'custom_table_views',
        mirror: 'CustomTableView',
        columns: [
            ...baseWithoutDelete,
            { name: 'table_id', type: 'text' },
            { name: 'name', type: 'text' },
            { name: 'type', type: 'text' },
            { name: 'group_by', type: 'text', nullable: true },
            { name: 'date_column', type: 'text', nullable: true },
            { name: 'filters', type: 'text', default: '[]' },
            { name: 'sort_by', type: 'text', nullable: true },
            { name: 'sort_order', type: 'text', default: 'asc' },
            { name: 'position', type: 'int', default: 0 },
        ],
    },
];
