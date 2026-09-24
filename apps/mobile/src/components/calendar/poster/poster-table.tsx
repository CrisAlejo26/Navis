import type { ReactNode } from 'react';
import { Rect, TSpan, Text as SvgText } from 'react-native-svg';
import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/accent';
import { dayNumber, rangeTitle, weekdayName } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';
import { truncatePosterText, wrapPosterText } from './poster-text';
import { TABLE_COLUMN, tableWeeks } from './poster-size';
import { POSTER_FONT } from './poster-font';

const PAD = 44;
const GAP = 3; // El aire entre columnas, el de la hoja de cálculo.
const HEADER_H = 44;
const CARD_PAD = 14;
const CARD_MIN_H = 150;
const CELL_PAD = 12;
// El ancho de texto real dentro de una columna: el de la celda menos el aire
// a los dos lados. Sin tope, un nombre largo se salía de su columna y quedaba
// escrito encima de la de al lado (§ el motivo de este fichero).
const TEXT_WIDTH = TABLE_COLUMN - CELL_PAD * 2;
const LINE_H = 24;
const ROLE_FONT = 16;
const NAME_FONT = 22;
// La fase en su línea, apagada, y el nombre debajo, en grande y negrita: la
// misma pareja «tenue arriba / fuerte abajo» de la lámina de la web. Con los
// dos en la misma línea y solo el color cambiando por `TSpan`, se leían
// igual —el `fontFamily` de un `TSpan` no siempre se aplica de fiar en
// Android (Regla del `toDataURL`)—, así que van en dos `SvgText` sueltos.
const NAME_GAP = 24;

/**
 * El cuerpo en **tabla** —el espejo SVG de `poster-table.tsx` de la web—: una
 * columna por día y sede, como la hoja de cálculo que se manda hoy al grupo.
 * Varias semanas van **una debajo de otra** y no seguidas a lo largo. Solo
 * salen las fases con alguien: lo que se comparte es lo que está repartido.
 */
export function posterTable({
    range,
    pal,
    top,
    congregationName,
    congregationAccent,
    showCongregation,
}: {
    range: CalendarRange;
    pal: PosterPalette;
    /** De dónde cuelga el cuerpo, en coordenadas del poster. */
    top: number;
    congregationName: (id: string) => string;
    congregationAccent: (id: string) => string;
    showCongregation: boolean;
}): { alto: number; nodes: ReactNode } {
    interface Columna {
        x: number;
        accent: string;
        cabecera: string;
        date: string;
        startTime: string;
        name: string;
        cardTop: number;
        cardH: number;
        dayY: number;
        meetingY: number;
        slots: {
            roleY: number;
            nameY: number;
            position: number;
            role: string;
            nameLines: string[];
        }[];
    }

    const semanas = tableWeeks(range);
    const bloques: { titulo: string | null; rowTop: number; rowH: number; columnas: Columna[] }[] =
        [];
    let y = top;

    for (const semana of semanas) {
        let titulo: string | null = null;
        if (semanas.length > 1) {
            titulo = rangeTitle(semana.from, semana.to);
            y += 37; // Línea de 22 px con su aire.
        }

        const rowTop = y;
        let rowH = 0;
        const columnas: Columna[] = [];

        for (const [index, { date, meetingIndex }] of semana.columns.entries()) {
            const day = range.days.find((one) => one.date === date);
            const meeting = day?.meetings[meetingIndex];
            if (!day || !meeting) continue;

            const cardTop = rowTop + HEADER_H;
            let cy = cardTop + CARD_PAD;
            const dayY = cy + 22; // El número del día, línea de 28 px.
            cy = dayY + 12;
            const meetingY = cy + 14; // Qué reunión es, línea de 17 px.
            cy = meetingY + 8;

            const slots = meeting.slots
                .filter((slot) => slot.believer)
                .map((slot) => {
                    const believer = slot.believer?.name ?? '';
                    const nameFull = `${believer}${slot.note ? ` · ${slot.note}` : ''}`;
                    const nameLines = wrapPosterText(nameFull, TEXT_WIDTH, {
                        fontSize: NAME_FONT,
                        maxLines: 2,
                    });

                    const roleY = cy + 15;
                    const nameY = roleY + NAME_GAP;
                    cy = nameY + (nameLines.length - 1) * LINE_H + 14;
                    return {
                        roleY,
                        nameY,
                        position: slot.position,
                        role: truncatePosterText(slot.name, TEXT_WIDTH, { fontSize: ROLE_FONT }),
                        nameLines,
                    };
                });

            const cardBottom = Math.max(cy + 8, cardTop + CARD_MIN_H);
            rowH = Math.max(rowH, cardBottom - rowTop);

            columnas.push({
                x: PAD + index * (TABLE_COLUMN + GAP),
                // Con varias sedes a la vista, el color diferencia la sede —para eso
                // está la leyenda—; con una sola, sigue diferenciando la fase, que es
                // lo único que hace falta distinguir.
                accent: accentHex(
                    showCongregation ? congregationAccent(meeting.congregationId) : meeting.accent,
                    pal.palette,
                ),
                cabecera: truncatePosterText(
                    showCongregation
                        ? `${weekdayName(date)} ${congregationName(meeting.congregationId)}`
                        : weekdayName(date),
                    TABLE_COLUMN - 16,
                    { fontSize: 21, bold: true },
                ),
                date,
                startTime: meeting.startTime,
                name: truncatePosterText(meeting.name.toUpperCase(), TEXT_WIDTH, {
                    fontSize: 17,
                    bold: true,
                    letterSpacing: 0.1 * 17,
                }),
                cardTop,
                cardH: cardBottom - cardTop,
                dayY,
                meetingY,
                slots,
            });
        }

        bloques.push({ titulo, rowTop, rowH, columnas });
        y = rowTop + rowH + 34;
    }

    const alto = y - 34 + 6;

    // Pintado: cabeceras y tarjetas primero, textos después — la tarjeta nunca
    // encima de lo que etiqueta.
    const nodes: ReactNode[] = [];
    for (const [bi, bloque] of bloques.entries()) {
        if (bloque.titulo) {
            nodes.push(
                <SvgText
                    key={`w-${String(bi)}`}
                    x={PAD}
                    y={bloque.rowTop - 27}
                    fontSize={22}
                    fontFamily={POSTER_FONT.semiBold}
                    fill={pal.muted}
                >
                    {bloque.titulo}
                </SvgText>,
            );
        }
        for (const [ci, col] of bloque.columnas.entries()) {
            nodes.push(
                <Rect
                    key={`h-${String(bi)}-${String(ci)}`}
                    x={col.x}
                    y={bloque.rowTop}
                    width={TABLE_COLUMN}
                    height={HEADER_H}
                    fill={col.accent}
                />,
                <Rect
                    key={`c-${String(bi)}-${String(ci)}`}
                    x={col.x}
                    y={col.cardTop}
                    width={TABLE_COLUMN}
                    height={Math.max(col.cardH, bloque.rowH - HEADER_H)}
                    fill={pal.card}
                    stroke={pal.border}
                    strokeWidth={1}
                />,
            );
        }
        for (const [ci, col] of bloque.columnas.entries()) {
            nodes.push(
                <SvgText
                    key={`ht-${String(bi)}-${String(ci)}`}
                    x={col.x + TABLE_COLUMN / 2}
                    y={bloque.rowTop + 29}
                    fontSize={21}
                    fontFamily={POSTER_FONT.semiBold}
                    fill="#ffffff"
                    textAnchor="middle"
                >
                    {col.cabecera}
                </SvgText>,
                <SvgText
                    key={`d-${String(bi)}-${String(ci)}`}
                    x={col.x + 12}
                    y={col.dayY}
                    fontSize={28}
                    fontFamily={POSTER_FONT.regular}
                    fill={pal.foreground}
                >
                    <TSpan>{dayNumber(col.date)}</TSpan>
                    <TSpan fill={pal.muted} fontSize={18}>
                        {' '}
                        · {col.startTime}
                    </TSpan>
                </SvgText>,
                <SvgText
                    key={`m-${String(bi)}-${String(ci)}`}
                    x={col.x + 12}
                    y={col.meetingY}
                    fontSize={17}
                    fontFamily={POSTER_FONT.semiBold}
                    letterSpacing={0.1 * 17}
                    fill={col.accent}
                >
                    {col.name}
                </SvgText>,
            );
            for (const slot of col.slots) {
                nodes.push(
                    <SvgText
                        key={`sr-${String(bi)}-${String(ci)}-${String(slot.position)}`}
                        x={col.x + 12}
                        y={slot.roleY}
                        fontSize={ROLE_FONT}
                        fontFamily={POSTER_FONT.regular}
                        fill={pal.muted}
                    >
                        {slot.role}
                    </SvgText>,
                    <SvgText
                        key={`sn-${String(bi)}-${String(ci)}-${String(slot.position)}`}
                        x={col.x + 12}
                        y={slot.nameY}
                        fontSize={NAME_FONT}
                        fontFamily={POSTER_FONT.bold}
                        fill={pal.foreground}
                    >
                        {slot.nameLines.map((line, index) => (
                            <TSpan key={String(index)} x={col.x + 12} dy={index === 0 ? 0 : LINE_H}>
                                {line}
                            </TSpan>
                        ))}
                    </SvgText>,
                );
            }
        }
    }

    return { alto, nodes };
}
