import type { TableColumnType, TableBelieverField } from '@navis/shared';
export const columnLabels: Record<
    TableColumnType,
    | 'tables.columnType.text'
    | 'tables.columnType.longText'
    | 'tables.columnType.number'
    | 'tables.columnType.currency'
    | 'tables.columnType.checkbox'
    | 'tables.columnType.date'
    | 'tables.columnType.singleSelect'
    | 'tables.columnType.multiSelect'
    | 'tables.columnType.email'
    | 'tables.columnType.phone'
    | 'tables.columnType.url'
    | 'tables.columnType.password'
> = {
    text: 'tables.columnType.text',
    long_text: 'tables.columnType.longText',
    number: 'tables.columnType.number',
    currency: 'tables.columnType.currency',
    checkbox: 'tables.columnType.checkbox',
    date: 'tables.columnType.date',
    single_select: 'tables.columnType.singleSelect',
    multi_select: 'tables.columnType.multiSelect',
    email: 'tables.columnType.email',
    phone: 'tables.columnType.phone',
    url: 'tables.columnType.url',
    password: 'tables.columnType.password',
};
export const boundLabels: Record<TableBelieverField, `tables.boundField.${TableBelieverField}`> = {
    fullName: 'tables.boundField.fullName',
    firstName: 'tables.boundField.firstName',
    lastName: 'tables.boundField.lastName',
    phone: 'tables.boundField.phone',
    email: 'tables.boundField.email',
    status: 'tables.boundField.status',
    congregation: 'tables.boundField.congregation',
    arrivedAt: 'tables.boundField.arrivedAt',
    lastNoteAt: 'tables.boundField.lastNoteAt',
    arrivalSite: 'tables.boundField.arrivalSite',
    bibleReadings: 'tables.boundField.bibleReadings',
    vivenciasReadings: 'tables.boundField.vivenciasReadings',
    bibleInstituteTimes: 'tables.boundField.bibleInstituteTimes',
};
