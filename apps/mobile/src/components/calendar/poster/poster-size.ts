import { startOfWeek, type CalendarRange } from '@navis/shared';

/** Los formatos de la lámina y el ancho real de cada uno, que es el del PNG. */
export type PosterAspect = 'portrait' | 'landscape' | 'table';

/** Cada columna de la tabla —un día en una sede— y el margen de la lámina. */
export const TABLE_COLUMN = 260;
export const TABLE_PADDING = 88;

export const POSTER_WIDTH: Record<PosterAspect, number> = {
    portrait: 1080,
    landscape: 1680,
    table: 1680,
};

export interface TableColumn {
    date: string;
    meetingIndex: number;
}

export interface TableWeek {
    /** El lunes de esa semana, que es lo que la nombra. */
    from: string;
    to: string;
    columns: TableColumn[];
}

/**
 * Las columnas de la tabla: **un día en una sede**, como en la hoja de cálculo
 * («Martes Alicante», «Martes Elda»…). Solo entran las que tienen a alguien:
 * lo que se comparte es lo que está repartido, no los huecos.
 */
export function tableColumns(range: CalendarRange): TableColumn[] {
    return range.days.flatMap((day) =>
        day.meetings
            .map((meeting, meetingIndex) => ({ meeting, meetingIndex }))
            .filter(
                ({ meeting }) =>
                    meeting.status !== 'cancelada' && meeting.slots.some((slot) => slot.believer),
            )
            .map(({ meetingIndex }) => ({ date: day.date, meetingIndex })),
    );
}

/**
 * La tabla, **partida por semanas**: una debajo de otra.
 *
 * Dos semanas seguidas a lo largo darían una tira de veintitantas columnas que
 * no se lee en ningún sitio; por semanas, cada bloque tiene el ancho de la
 * hoja de cálculo de siempre.
 */
export function tableWeeks(range: CalendarRange): TableWeek[] {
    const semanas = new Map<string, TableColumn[]>();

    for (const columna of tableColumns(range)) {
        const lunes = startOfWeek(columna.date);
        semanas.set(lunes, [...(semanas.get(lunes) ?? []), columna]);
    }

    return [...semanas.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([from, columns]) => ({
            from,
            to: columns[columns.length - 1]?.date ?? from,
            columns,
        }));
}

/** Tan ancha como la semana más cargada: todas las filas quedan alineadas. */
export function posterWidth(aspect: PosterAspect, range: CalendarRange): number {
    if (aspect !== 'table') return POSTER_WIDTH[aspect];

    const columnas = Math.max(...tableWeeks(range).map((semana) => semana.columns.length), 1);
    return Math.max(POSTER_WIDTH.portrait, columnas * TABLE_COLUMN + TABLE_PADDING);
}

/**
 * Cuántas celdas en blanco hacen falta antes del primer día de la rejilla
 * apaisada para que caiga en su columna de verdad (la pareja de
 * `poster-grid-blanks.ts` de la web): la semana empieza en lunes y
 * `weekdayOf` da 0 en domingo, así que se convierte con `(+ 6) % 7`.
 */
export function leadingBlanks(firstDay: string | undefined): number {
    if (!firstDay) return 0;
    return (parseIsoWeekday(firstDay) + 6) % 7;
}

function parseIsoWeekday(iso: string): number {
    const [year = 0, month = 1, day = 1] = iso.slice(0, 10).split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
