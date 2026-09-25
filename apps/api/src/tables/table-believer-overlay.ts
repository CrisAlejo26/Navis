import {
    believerName,
    type CustomTableColumn,
    type CustomTableRow as CustomTableRowView,
    type RowData,
    type TableBelieverField,
} from '@navis/shared';

import { toIsoDay } from '../database/iso-day';

/**
 * El creyente con lo que hace falta para rellenar una celda vinculada (RFC
 * 0025 D5). Estructural a propósito: quien lo trae —la página, la
 * exportación— puede traer la entidad entera o una proyección.
 */
export interface BelieverSource {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
    status: string;
    congregationId: string | null;
    arrivedAt: string | Date | null;
    lastNoteAt: string | Date | null;
    arrivalSite: string | null;
    bibleReadings: number | null;
    vivenciasReadings: number | null;
    bibleInstituteTimes: number | null;
    photoKey: string | null;
}

/**
 * El valor vivo de un campo, convertido a la forma que espera el tipo de
 * columna: fechas como día de calendario (`toIsoDay`, la trampa del día
 * anterior), números como número, texto como texto.
 */
export function boundValue(
    field: TableBelieverField,
    believer: BelieverSource,
    congregationName: string | null,
): unknown {
    switch (field) {
        case 'fullName':
            return believerName(believer);
        case 'firstName':
            return believer.firstName;
        case 'lastName':
            return believer.lastName || null;
        case 'phone':
            return believer.phone;
        case 'email':
            return believer.email;
        case 'status':
            // La etiqueta la traduce el cliente (D17): aquí viaja la clave.
            return believer.status;
        case 'congregation':
            return congregationName;
        case 'arrivedAt':
            return believer.arrivedAt === null ? null : toIsoDay(believer.arrivedAt);
        case 'lastNoteAt':
            return believer.lastNoteAt === null ? null : toIsoDay(believer.lastNoteAt);
        case 'arrivalSite':
            return believer.arrivalSite;
        case 'bibleReadings':
            return believer.bibleReadings;
        case 'vivenciasReadings':
            return believer.vivenciasReadings;
        case 'bibleInstituteTimes':
            return believer.bibleInstituteTimes;
    }
}

/**
 * Escribe el valor vivo de cada columna vinculada bajo su `key` (D11), como si
 * fuera un valor más del JSON. Sin creyente —fila hecha a mano antes de
 * enlazar, o creyente dado de baja— la celda queda vacía (D7, D15): lo escrito
 * a mano en esa columna no se muestra mientras esté vinculada.
 *
 * Lo guardado en el JSON de la fila no se toca (D6): vuelve a verse al
 * desvincular. Solo se cambia la copia que viaja al cliente.
 */
export function fillBoundData(
    data: RowData,
    boundColumns: readonly Pick<CustomTableColumn, 'key' | 'believerField'>[],
    believer: BelieverSource | null,
    congregationName: string | null,
): void {
    for (const column of boundColumns) {
        if (!column.believerField) continue;
        data[column.key] = believer
            ? boundValue(column.believerField, believer, congregationName)
            : null;
    }
}

/** La fila lista para el cliente con sus columnas vinculadas resueltas (D11). */
export function overlayBoundRow(
    view: CustomTableRowView,
    boundColumns: readonly Pick<CustomTableColumn, 'key' | 'believerField'>[],
    believer: BelieverSource | null,
    congregationName: string | null,
): CustomTableRowView {
    fillBoundData(view.data, boundColumns, believer, congregationName);
    return view;
}

/** Las columnas activas que tienen campo del creyente, en su orden. */
export function boundColumnsOf(
    columns: readonly CustomTableColumn[],
): readonly Pick<CustomTableColumn, 'key' | 'believerField'>[] {
    return columns.filter((one) => one.believerField !== null);
}
