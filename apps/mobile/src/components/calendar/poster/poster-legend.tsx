import type { ReactNode } from 'react';
import { Circle, Text as SvgText } from 'react-native-svg';
import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/accent';
import type { PosterPalette } from './poster-palette';
import { POSTER_FONT } from './poster-font';

const DOT_R = 7;
const GAP_AFTER_DOT = 10;
const GAP_BETWEEN_ITEMS = 30;
const ROW_H = 32;
const FONT_SIZE = 19;
// Estimación del ancho de un nombre a este tamaño (Regla: mismo criterio que
// `poster-text.ts`, sin importarlo para no acoplar un módulo de texto a otro
// de trazado): suficiente para decidir cuándo pasar de fila.
const CHAR_W = FONT_SIZE * 0.55;

/**
 * La guía de colores de la lámina: qué color es cada sede, para no tener que
 * comparar cabeceras letra a letra. Con una sola sede en la vista no hace
 * falta —ya lo dice `showCongregation`—, y solo lista las que de verdad
 * aparecen en el tramo que se comparte, no todo el catálogo de la iglesia.
 */
export function posterLegend({
    range,
    pal,
    top,
    left,
    maxWidth,
    congregationName,
    congregationAccent,
}: {
    range: CalendarRange;
    pal: PosterPalette;
    /** De dónde cuelga la leyenda, en coordenadas del poster. */
    top: number;
    left: number;
    maxWidth: number;
    congregationName: (id: string) => string;
    congregationAccent: (id: string) => string;
}): { alto: number; nodes: ReactNode } {
    const ids = [
        ...new Set(
            range.days.flatMap((day) => day.meetings.map((meeting) => meeting.congregationId)),
        ),
    ];

    const nodes: ReactNode[] = [];
    let x = left;
    let row = 0;

    for (const id of ids) {
        const name = congregationName(id);
        const itemWidth = DOT_R * 2 + GAP_AFTER_DOT + name.length * CHAR_W + GAP_BETWEEN_ITEMS;
        if (x + itemWidth > left + maxWidth && x > left) {
            row += 1;
            x = left;
        }

        // `top` es el borde superior de la leyenda, no una línea base: se baja
        // lo que hace falta para que el texto —y no su techo— quede dentro.
        const y = top + 23 + row * ROW_H;
        nodes.push(
            <Circle
                key={`d-${id}`}
                cx={x + DOT_R}
                cy={y - 6}
                r={DOT_R}
                fill={accentHex(congregationAccent(id), pal.palette)}
            />,
            <SvgText
                key={`t-${id}`}
                x={x + DOT_R * 2 + GAP_AFTER_DOT}
                y={y}
                fontSize={FONT_SIZE}
                fontFamily={POSTER_FONT.medium}
                fill={pal.foreground}
            >
                {name}
            </SvgText>,
        );

        x += itemWidth;
    }

    return { alto: ids.length === 0 ? 0 : (row + 1) * ROW_H, nodes };
}
