import type { ReactNode } from 'react';
import { Rect, TSpan, Text as SvgText } from 'react-native-svg';
import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/accent';
import { longDay } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';
import { truncatePosterText } from './poster-text';
import { POSTER_FONT } from './poster-font';

const PAD = 44;
const TEXT_X = 68; // 44 de margen + 6 de cinta + 18 de aire
const CANVAS_WIDTH = 1080; // El lienzo de la vertical (poster-size.ts).
/** Cuánto puede crecer un nombre de creyente sin salirse del lienzo. */
const BELIEVER_WIDTH = CANVAS_WIDTH - (TEXT_X + 250) - PAD;

/**
 * El cuerpo vertical de la lámina móvil —el espejo SVG de `poster-days.tsx` de
 * la web—: un bloque por día con la cinta de fases entera, para leerse de un
 * vistazo en un móvil ajeno. Las fases sin nadie **también salen** («Sin
 * asignar» en apagado), igual que en pantalla: si falta alguien, que se vea.
 *
 * Se dibuja en el lienzo de la web (1080 de ancho): el `viewBox` del poster
 * escala solo, así que las medidas son las mismas en las dos plataformas.
 */
export function posterDays({
  range,
  pal,
  top,
  congregationName,
  congregationAccent,
  showCongregation,
  unassignedLabel,
}: {
  range: CalendarRange;
  pal: PosterPalette;
  /** De dónde cuelga el cuerpo, en coordenadas del poster. */
  top: number;
  congregationName: (id: string) => string;
  congregationAccent: (id: string) => string;
  showCongregation: boolean;
  unassignedLabel: string;
}): { alto: number; nodes: ReactNode } {
  interface Bloque {
    date: string;
    labelY: number;
    reuniones: {
      accent: string;
      ribbonY: number;
      ribbonH: number;
      nameY: number;
      meetingName: string;
      startTime: string;
      congregation: string | null;
      slots: { y: number; position: number; name: string; believer: string | null }[];
    }[];
  }

  const dias: Bloque[] = [];
  let y = top;

  for (const day of range.days.filter((one) => one.meetings.length > 0)) {
    const labelY = y + 17; // Línea de 22 px.
    y = labelY + 37; // Primera reunión, con el aire del bloque.
    const reuniones: Bloque['reuniones'] = [];

    for (const meeting of day.meetings) {
      const nameY = y;
      let lastBaseline = nameY;
      y = nameY + 34;

      const slots = meeting.slots.map((slot) => {
        const slotY = y;
        lastBaseline = slotY;
        y = slotY + 34;
        return {
          y: slotY,
          position: slot.position,
          name: slot.name,
          believer: slot.believer?.name ?? null,
        };
      });

      reuniones.push({
        // Mismo criterio que en la tabla: con varias sedes, el color
        // diferencia la sede; con una sola, sigue siendo la fase.
        accent: accentHex(
          showCongregation ? congregationAccent(meeting.congregationId) : meeting.accent,
          pal.palette,
        ),
        ribbonY: nameY - 20,
        ribbonH: lastBaseline - nameY + 24,
        nameY,
        meetingName: meeting.name,
        startTime: meeting.startTime,
        congregation: showCongregation ? congregationName(meeting.congregationId) : null,
        slots,
      });

      y = lastBaseline + 22;
    }

    dias.push({ date: day.date, labelY, reuniones });
    y += 14;
  }

  const alto = y - 14 - 20 + 10;

  // Pintado: primero las etiquetas de día, luego **todas** las cintas de
  // color, después los textos — el color siempre detrás de lo que etiqueta.
  const nodes: ReactNode[] = [];
  for (const dia of dias) {
    nodes.push(
      <SvgText
        key={`d-${dia.date}`}
        x={PAD}
        y={dia.labelY}
        fontSize={22}
        fontFamily={POSTER_FONT.semiBold}
        letterSpacing={0.14 * 22}
        fill={pal.muted}
      >
        {longDay(dia.date).toUpperCase()}
      </SvgText>,
    );
  }
  for (const dia of dias) {
    for (const [index, reunion] of dia.reuniones.entries()) {
      nodes.push(
        <Rect
          key={`r-${dia.date}-${String(index)}`}
          x={PAD}
          y={reunion.ribbonY}
          width={6}
          height={reunion.ribbonH}
          rx={3}
          fill={reunion.accent}
        />,
      );
    }
  }
  for (const dia of dias) {
    for (const [index, reunion] of dia.reuniones.entries()) {
      nodes.push(
        <SvgText
          key={`n-${dia.date}-${String(index)}`}
          x={TEXT_X}
          y={reunion.nameY}
          fontSize={26}
          fontFamily={POSTER_FONT.semiBold}
          fill={pal.foreground}
        >
          <TSpan>{reunion.meetingName}</TSpan>
          <TSpan fill={pal.muted} fontFamily={POSTER_FONT.regular} fontSize={22}>
            {' '}
            {reunion.startTime}
          </TSpan>
          {reunion.congregation ? (
            <TSpan fill={reunion.accent} fontFamily={POSTER_FONT.semiBold} fontSize={20}>
              {' '}
              {reunion.congregation}
            </TSpan>
          ) : null}
        </SvgText>,
      );
      for (const slot of reunion.slots) {
        nodes.push(
          <SvgText
            key={`p-${dia.date}-${String(index)}-${String(slot.position)}`}
            x={TEXT_X}
            y={slot.y}
            fontSize={18}
            // Apagada y sin negrita a propósito: es la etiqueta, no lo que
            // tiene que saltar a la vista. Antes iba en semibold, más fuerte
            // que el propio nombre, y competía con él en vez de cederle el
            // protagonismo (misma pareja «tenue arriba / fuerte» que en
            // poster-table.tsx).
            fontFamily={POSTER_FONT.regular}
            letterSpacing={0.1 * 18}
            fill={pal.muted}
          >
            {truncatePosterText(slot.name.toUpperCase(), 230, {
              fontSize: 18,
              letterSpacing: 0.1 * 18,
            })}
          </SvgText>,
        );
        nodes.push(
          <SvgText
            key={`b-${dia.date}-${String(index)}-${String(slot.position)}`}
            x={TEXT_X + 250}
            y={slot.y}
            fontSize={26}
            fontFamily={slot.believer ? POSTER_FONT.bold : POSTER_FONT.regular}
            fill={slot.believer ? pal.foreground : pal.muted}
          >
            {truncatePosterText(slot.believer ?? unassignedLabel, BELIEVER_WIDTH, { fontSize: 26 })}
          </SvgText>,
        );
      }
    }
  }

  return { alto, nodes };
}
