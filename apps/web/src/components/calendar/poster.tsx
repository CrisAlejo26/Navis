import logoBlanco from '@navis/theme/logo/encuadrado/blanco.svg?inline';
import { brandColorHex, type ResolvedTheme } from '@navis/theme';
import type { CalendarRange } from '@navis/shared';
import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';

import { PosterDays } from './poster-days';
import { PosterGrid } from './poster-grid';
import { posterPalette } from './poster-palette';
import { POSTER_WIDTH, type PosterAspect } from './poster-size';

/**
 * **La lámina que se comparte.** No es una captura de la pantalla: es una
 * composición propia, sin controles, pensada para leerse en el móvil de otra
 * persona (RFC 0002 D13).
 *
 * Todo va con estilos en línea, colores hexadecimales y el logo incrustado
 * como `data:`, que es lo que permite rasterizarla sin cargar nada de fuera
 * (ver `rasterize.ts`).
 */
export const Poster = forwardRef<
  HTMLDivElement,
  {
    range: CalendarRange;
    aspect: PosterAspect;
    theme: ResolvedTheme;
    churchName: string;
    title: string;
    month: string;
    congregationName: (id: string) => string;
    showCongregation: boolean;
    subtitle?: string;
  }
>(function Poster(
  { range, aspect, theme, churchName, title, month, congregationName, showCongregation, subtitle },
  ref,
) {
  const { t } = useTranslation();
  const palette = posterPalette(theme);

  return (
    <div
      ref={ref}
      style={{
        width: `${String(POSTER_WIDTH[aspect])}px`,
        background: palette.background,
        color: palette.foreground,
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: brandColorHex,
          color: '#ffffff',
          padding: '34px 44px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
        }}
      >
        <img src={logoBlanco} alt="" width={64} height={64} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '30px', fontWeight: 600 }}>{churchName}</span>
          {subtitle && <span style={{ fontSize: '22px', opacity: 0.85 }}>{subtitle}</span>}
        </div>
      </div>

      <div style={{ padding: '40px 44px 20px', fontSize: '40px', fontWeight: 600 }}>{title}</div>

      <div style={{ padding: '0 44px 40px' }}>
        {aspect === 'portrait' ? (
          <PosterDays
            range={range}
            palette={palette}
            congregationName={congregationName}
            showCongregation={showCongregation}
            unassignedLabel={t('calendar.unassigned')}
          />
        ) : (
          <PosterGrid range={range} palette={palette} month={month} />
        )}
      </div>

      <div style={{ padding: '0 44px 30px', fontSize: '17px', color: palette.muted }}>
        {t('calendar.generatedOn', { date: new Date().toLocaleDateString() })}
      </div>
    </div>
  );
});
