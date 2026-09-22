import type { ReactNode } from 'react';
import { Rect, TSpan, Text as SvgText } from 'react-native-svg';
import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/accent';
import { dayNumber, weekdayHeadings } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';
import { leadingBlanks, POSTER_WIDTH } from './poster-size';
import { truncatePosterText, wrapPosterText } from './poster-text';
import { POSTER_FONT } from './poster-font';

const PAD = 44;
const GAP = 8;
const CARD_PAD = 10;
const CARD_MIN_H = 150;
const LINE_H = 18;
const ROLE_FONT = 12;
const NAME_FONT = 15;
// La fase apagada arriba, el nombre grande y en negrita debajo: mismo motivo
// que en poster-table.tsx, con la letra más pequeña porque la tarjeta del
// mes es más estrecha.
const NAME_GAP = 17;

/**
 * El cuerpo apaisado —el espejo SVG de `poster-grid.tsx` de la web—: la
 * rejilla del mes con sus cabeceras de día, en la que caben tres semanas y el
 * mes entero. Los días de fuera del mes se apagan, no se esconden; las fases
 * sin nadie salen como línea de puntos, igual que en pantalla.
 */
export function posterGrid({
  range,
  pal,
  top,
  month,
  congregationName,
  congregationAccent,
  showCongregation,
}: {
  range: CalendarRange;
  pal: PosterPalette;
  /** De dónde cuelga el cuerpo, en coordenadas del poster. */
  top: number;
  /** `AAAA-MM`: los días de otro mes van apagados. */
  month: string;
  congregationName: (id: string) => string;
  congregationAccent: (id: string) => string;
  showCongregation: boolean;
}): { alto: number; nodes: ReactNode } {
  const width = POSTER_WIDTH.landscape;
  const colW = (width - PAD * 2 - GAP * 6) / 7;
  // El ancho de texto dentro de una tarjeta del mes: el de la columna menos
  // el aire a los dos lados. Sin tope, un nombre largo invadía la tarjeta de
  // al lado, que en la rejilla apaisada es todavía más estrecha que en la
  // tabla (§ poster-text.ts).
  const textWidth = colW - 32;
  const blanks = leadingBlanks(range.days[0]?.date);
  const celdas = blanks + range.days.length;

  interface Reunion {
    barY: number;
    barH: number;
    nameY: number;
    name: string;
    time: string;
    accent: string;
    slots: { roleY: number; nameY: number; role: string; nameLines: string[] }[];
    dots: boolean;
    dotsY: number;
  }

  interface Tarjeta {
    x: number;
    y: number;
    h: number;
    date: string;
    outside: boolean;
    reuniones: Reunion[];
  }

  const filas: Tarjeta[][] = [];
  let y = top + 13; // Cabeceras de día, línea de 17 px.
  y += 23; // La rejilla empieza debajo.

  for (let celda = 0; celda < celdas; celda += 7) {
    const rowTop = y;
    let rowH = CARD_MIN_H;
    const tarjetas: Tarjeta[] = [];

    for (let col = 0; col < 7; col++) {
      const slot = celda + col;
      if (slot < blanks) continue;
      const day = range.days[slot - blanks];
      if (!day) continue;

      const x = PAD + col * (colW + GAP);
      let cy = rowTop + CARD_PAD + 19; // El número del día, línea de 24 px.
      cy += 11;

      const reuniones: Reunion[] = [];
      for (const meeting of day.meetings) {
        // Mismo criterio que en la tabla y la vertical: con varias sedes, el
        // color diferencia la sede; con una sola, sigue siendo la fase.
        const accent = accentHex(
          showCongregation ? congregationAccent(meeting.congregationId) : meeting.accent,
          pal.palette,
        );
        const nameY = cy + 11; // La reunión, línea de 14 px.
        cy = nameY + 6;

        const slots = meeting.slots
          .filter((slot2) => slot2.believer)
          .map((slot2) => {
            const believer = slot2.believer?.name ?? '';
            const nameLines = wrapPosterText(believer, textWidth, {
              fontSize: NAME_FONT,
              maxLines: 2,
            });

            const roleY = cy + 10;
            const nameY = roleY + NAME_GAP;
            cy = nameY + (nameLines.length - 1) * LINE_H + 6;
            return {
              roleY,
              nameY,
              role: truncatePosterText(slot2.name, textWidth, { fontSize: ROLE_FONT }),
              nameLines,
            };
          });

        // Debajo de lo que ya se pintó (`cy`), no de la reunión (`nameY`):
        // con al menos una fase asignada, «relativo al título» caía encima
        // de su rol o su nombre en vez de debajo de todos.
        const dots = meeting.slots.some((slot2) => !slot2.believer);
        const dotsY = cy + 15;
        if (dots) cy += 19; // La línea de puntos, de 15 px.

        // Con varias sedes, la sede sustituye a la fase en esta línea —ya la
        // dice el color de la cinta y de la propia sede en la leyenda—; con
        // una sola, sigue siendo la fase, que es lo que hace falta saber.
        const label = showCongregation
          ? congregationName(meeting.congregationId)
          : meeting.name.toUpperCase();
        reuniones.push({
          barY: nameY - 8,
          barH: cy + 4 - (nameY - 8),
          nameY,
          name: truncatePosterText(label, textWidth, {
            fontSize: 14,
            bold: true,
            letterSpacing: 0.08 * 14,
          }),
          time: meeting.startTime,
          accent,
          slots,
          dots,
          dotsY,
        });
        cy += 4; // El aire entre reuniones del mismo día.
      }

      const cardH = Math.max(cy + 10 - rowTop, CARD_MIN_H);
      rowH = Math.max(rowH, cardH);

      tarjetas.push({
        x,
        y: rowTop,
        h: cardH,
        date: day.date,
        outside: !day.date.startsWith(month),
        reuniones,
      });
    }

    // El alto de la fila lo manda la tarjeta más cargada; las demás quedan
    // iguales, como en el mes de la web.
    for (const tarjeta of tarjetas) tarjeta.h = Math.max(tarjeta.h, rowH);
    filas.push(tarjetas);
    y = rowTop + rowH + GAP;
  }

  const alto = y - GAP + 6;

  // Pintado: cabeceras, tarjetas y barras de color primero; textos después —
  // el color nunca queda encima de lo que etiqueta.
  const nodes: ReactNode[] = [];
  const headings = weekdayHeadings(range.days[0]?.date ?? '2026-08-15');
  for (const [index, heading] of headings.entries()) {
    nodes.push(
      <SvgText
        key={`h-${heading.key}`}
        x={PAD + index * (colW + GAP)}
        y={top + 13}
        fontSize={17}
        fontFamily={POSTER_FONT.semiBold}
        letterSpacing={0.14 * 17}
        fill={pal.muted}
      >
        {heading.label.toUpperCase()}
      </SvgText>,
    );
  }
  for (const [fi, fila] of filas.entries()) {
    for (const [ci, tarjeta] of fila.entries()) {
      nodes.push(
        <Rect
          key={`c-${String(fi)}-${String(ci)}`}
          x={tarjeta.x}
          y={tarjeta.y}
          width={colW}
          height={tarjeta.h}
          rx={10}
          fill={pal.card}
          stroke={pal.border}
          strokeWidth={1}
          opacity={tarjeta.outside ? 0.45 : 1}
        />,
      );
      for (const [ri, reunion] of tarjeta.reuniones.entries()) {
        nodes.push(
          <Rect
            key={`b-${String(fi)}-${String(ci)}-${String(ri)}`}
            x={tarjeta.x + 10}
            y={reunion.barY}
            width={4}
            height={reunion.barH}
            rx={2}
            fill={reunion.accent}
          />,
        );
      }
    }
  }
  for (const [fi, fila] of filas.entries()) {
    for (const [ci, tarjeta] of fila.entries()) {
      const apagado = tarjeta.outside ? 0.45 : undefined;
      nodes.push(
        <SvgText
          key={`n-${String(fi)}-${String(ci)}`}
          x={tarjeta.x + 10}
          y={tarjeta.y + CARD_PAD + 19}
          fontSize={24}
          fontFamily={POSTER_FONT.regular}
          fill={pal.foreground}
          opacity={apagado}
        >
          {dayNumber(tarjeta.date)}
        </SvgText>,
      );
      for (const [ri, reunion] of tarjeta.reuniones.entries()) {
        nodes.push(
          <SvgText
            key={`m-${String(fi)}-${String(ci)}-${String(ri)}`}
            x={tarjeta.x + 22}
            y={reunion.nameY}
            fontSize={14}
            fontFamily={POSTER_FONT.semiBold}
            letterSpacing={0.08 * 14}
            fill={reunion.accent}
            opacity={apagado}
          >
            <TSpan>{reunion.name}</TSpan>
            <TSpan fill={pal.muted} fontFamily={POSTER_FONT.regular} letterSpacing={0}>
              {' '}
              {reunion.time}
            </TSpan>
          </SvgText>,
        );
        for (const [si, slot] of reunion.slots.entries()) {
          nodes.push(
            <SvgText
              key={`sr-${String(fi)}-${String(ci)}-${String(ri)}-${String(si)}`}
              x={tarjeta.x + 22}
              y={slot.roleY}
              fontSize={ROLE_FONT}
              fontFamily={POSTER_FONT.regular}
              fill={pal.muted}
              opacity={apagado}
            >
              {slot.role}
            </SvgText>,
            <SvgText
              key={`sn-${String(fi)}-${String(ci)}-${String(ri)}-${String(si)}`}
              x={tarjeta.x + 22}
              y={slot.nameY}
              fontSize={NAME_FONT}
              fontFamily={POSTER_FONT.bold}
              fill={pal.foreground}
              opacity={apagado}
            >
              {slot.nameLines.map((line, index) => (
                <TSpan key={String(index)} x={tarjeta.x + 22} dy={index === 0 ? 0 : LINE_H}>
                  {line}
                </TSpan>
              ))}
            </SvgText>,
          );
        }
        if (reunion.dots) {
          nodes.push(
            <SvgText
              key={`p-${String(fi)}-${String(ci)}-${String(ri)}`}
              x={tarjeta.x + 22}
              y={reunion.dotsY}
              fontSize={15}
              fill={pal.muted}
              opacity={apagado}
            >
              {'·'.repeat(12)}
            </SvgText>,
          );
        }
      }
    }
  }

  return { alto, nodes };
}
