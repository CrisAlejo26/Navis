import logoBlanco from '@navis/theme/logo/encuadrado/blanco.svg?inline';
import { brandColorHex } from '@navis/theme';
import { extractTeachingBodyText, type Teaching } from '@navis/shared';
import type { Ref } from 'react';

import { formatDay } from '@/lib/format';

export const CARD_WIDTH = 1080;

/** Cuánto del texto entra en un párrafo cómodo antes de recortarlo, como en la del cuaderno. */
const EXCERPT_LENGTH = 420;

function excerptFor(text: string): { text: string; cut: boolean } {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return { text: flat, cut: false };

  const cortado = flat.slice(0, EXCERPT_LENGTH);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  const cut = ultimoEspacio > EXCERPT_LENGTH / 2 ? cortado.slice(0, ultimoEspacio) : cortado;
  return { text: cut, cut: true };
}

/**
 * **La postal que se comparte** (RFC 0022 §4.5), hermana de `JournalEntryCard`
 * (RFC 0017): banda de marca con el logo, título, fecha y un extracto en
 * texto plano —una imagen es una postal de una enseñanza, no un facsímil del
 * editor entero—.
 *
 * Estilos en línea y hexadecimales, sin Tailwind ni `oklch`: el rasterizador
 * mete el nodo en un `<foreignObject>` (`lib/share/rasterize.ts`).
 */
export function TeachingPostcard({
  ref,
  teaching,
  appName,
  continuesLabel,
}: {
  ref?: Ref<HTMLDivElement>;
  teaching: Teaching;
  appName: string;
  continuesLabel: string;
}) {
  const { text: plain } = extractTeachingBodyText(teaching.body);
  const { text: excerpt, cut } = excerptFor(plain);

  return (
    <div
      ref={ref}
      style={{
        width: `${String(CARD_WIDTH)}px`,
        background: '#ffffff',
        color: '#101728',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          background: brandColorHex,
          color: '#ffffff',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
        }}
      >
        <img src={logoBlanco} alt="" width={56} height={56} />
        <span style={{ fontSize: '26px', fontWeight: 600 }}>{appName}</span>
      </div>

      <div style={{ padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <span style={{ fontSize: '20px', color: '#5b6577' }}>{formatDay(teaching.receivedAt)}</span>

        <p style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          {teaching.title}
        </p>

        <p style={{ fontSize: '26px', lineHeight: 1.6, margin: 0 }}>
          {excerpt}
          {cut && <span style={{ color: '#5b6577' }}> {continuesLabel}</span>}
        </p>
      </div>
    </div>
  );
}
