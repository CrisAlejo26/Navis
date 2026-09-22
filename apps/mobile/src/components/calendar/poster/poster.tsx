import { useTranslation } from 'react-i18next';
import { Rect, Svg, Text as SvgText } from 'react-native-svg';
import { brandColorHex, type ResolvedTheme } from '@navis/theme';
import type { CalendarRange } from '@navis/shared';

import { BoatGlyph } from '@/components/home/logo-boat';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';
import type { PosterAspect } from './poster-size';
import { posterWidth } from './poster-size';
import { posterPalette } from './poster-palette';
import { posterDays } from './poster-days';
import { posterGrid } from './poster-grid';
import { posterTable } from './poster-table';
import { posterLegend } from './poster-legend';
import { POSTER_FONT } from './poster-font';

const BAND_H = 132; // La banda de marca: 34 de aire + logo de 64 + 34.
const TITLE_BASE = BAND_H + 40 + 30; // La línea del título, tras el aire de 40.
const BODY_TOP = BAND_H + 100; // El bloque del título mide 40 + 40 + 20.
const BODY_BOTTOM_PAD = 40;
const FOOTER_H = 61; // Línea de 17 px con 14 de aire y 30 de pie.

/**
 * La **lámina** del calendario en móvil —el espejo SVG de `poster.tsx` de la
 * web (RFC 0002 D13)—. No es una captura de la pantalla: es una composición
 * propia, sin controles, pensada para leerse en el móvil de otra persona, con
 * los tres formatos de la web (vertical, tabla y apaisada).
 *
 * Se dibuja en el lienzo de la web —1080 de ancho en vertical, 1680 en los
 * otros dos— y el `viewBox` escala a cualquier `width`: la vista previa y el
 * PNG de exportación son la misma pieza a distinta escala. Los colores salen
 * de `themeColorsHex` (D14) y el logo, incrustado en la banda de marca, no
 * carga nada de fuera.
 */
export function Poster({
  range,
  aspect,
  churchName,
  subtitle,
  title,
  month,
  congregationName,
  congregationAccent,
  showCongregation,
  width,
}: {
  range: CalendarRange;
  aspect: PosterAspect;
  churchName: string;
  /** El calendario y, si va sola, la sede: sale en la cabecera. */
  subtitle?: string;
  title: string;
  /** `AAAA-MM`: en apaisada, los días de otro mes van apagados. */
  month: string;
  congregationName: (id: string) => string;
  congregationAccent: (id: string) => string;
  showCongregation: boolean;
  /** El ancho con el que se pinta; el alto sale del `viewBox`. */
  width: number;
}) {
  const { t } = useTranslation();
  const theme = useThemeStore<ResolvedTheme>((state) => state.resolvedTheme);
  const pal = posterPalette(theme);
  const baseW = posterWidth(aspect, range);

  // La guía de colores: qué color es cada sede, para que el color de las
  // columnas/cintas/tarjetas (arriba, en poster-table.tsx, poster-days.tsx y
  // poster-grid.tsx) diga algo. En los tres formatos ese color pasa a
  // representar la sede en cuanto hay más de una a la vista.
  const LEGEND_TOP = TITLE_BASE + 18; // El aire bajo la línea del título.
  const legend = showCongregation
    ? posterLegend({
        range,
        pal,
        top: LEGEND_TOP,
        left: 44,
        maxWidth: baseW - 88,
        congregationName,
        congregationAccent,
      })
    : null;
  const bodyTop = legend && legend.alto > 0 ? LEGEND_TOP + legend.alto + 14 : BODY_TOP;

  const body =
    aspect === 'portrait'
      ? posterDays({
          range,
          pal,
          top: bodyTop,
          congregationName,
          congregationAccent,
          showCongregation,
          unassignedLabel: t('calendar.unassigned'),
        })
      : aspect === 'table'
        ? posterTable({
            range,
            pal,
            top: bodyTop,
            congregationName,
            congregationAccent,
            showCongregation,
          })
        : posterGrid({
            range,
            pal,
            top: bodyTop,
            month,
            congregationName,
            congregationAccent,
            showCongregation,
          });

  const alto = bodyTop + body.alto + BODY_BOTTOM_PAD + FOOTER_H;
  const footerY = bodyTop + body.alto + BODY_BOTTOM_PAD + 14;

  return (
    <Svg
      width={width}
      height={Math.round((alto * width) / baseW)}
      viewBox={`0 0 ${String(baseW)} ${String(alto)}`}
    >
      <Rect x={0} y={0} width={baseW} height={alto} fill={pal.background} />

      {/* La banda de marca, como en la web: el barco en blanco y el nombre. */}
      <Rect x={0} y={0} width={baseW} height={BAND_H} fill={brandColorHex} />
      <BoatGlyph size={64} x={44} y={34} fill="#ffffff" />
      <SvgText
        x={128}
        y={subtitle ? 70 : 79}
        fontSize={30}
        fontFamily={POSTER_FONT.semiBold}
        fill="#ffffff"
      >
        {churchName}
      </SvgText>
      {subtitle ? (
        <SvgText
          x={128}
          y={104}
          fontSize={22}
          fontFamily={POSTER_FONT.regular}
          fill="#ffffff"
          fillOpacity={0.85}
        >
          {subtitle}
        </SvgText>
      ) : null}

      <SvgText
        x={44}
        y={TITLE_BASE}
        fontSize={40}
        fontFamily={POSTER_FONT.semiBold}
        fill={pal.foreground}
      >
        {title}
      </SvgText>

      {legend?.nodes}
      {body.nodes}

      <SvgText x={44} y={footerY} fontSize={17} fontFamily={POSTER_FONT.regular} fill={pal.muted}>
        {t('calendar.generatedOn', {
          date: formatDay(new Date().toISOString().slice(0, 10), 'short'),
        })}
      </SvgText>
    </Svg>
  );
}
