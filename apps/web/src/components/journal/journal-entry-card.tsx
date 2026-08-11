import logoBlanco from '@navis/theme/logo/encuadrado/blanco.svg?inline';
import { brandColorHex } from '@navis/theme';
import type { JournalEntry } from '@navis/shared';
import type { Ref } from 'react';
import { useTranslation } from 'react-i18next';

import { accentForeground, accentHex } from '@/lib/accents';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { formatDay, formatDateTime } from '@/lib/format';

export const CARD_WIDTH = 1080;

/** Cuánto de la anotación entra en un párrafo cómodo antes de recortarla (D13). */
const EXCERPT_LENGTH = 420;

/** Cortada en palabra, como el extracto del listado, pero más larga: aquí cabe un párrafo. */
function excerptFor(annotation: string): { text: string; cut: boolean } {
  const flat = annotation.replace(/\s+/g, ' ').trim();
  if (flat.length <= EXCERPT_LENGTH) return { text: flat, cut: false };

  const cortado = flat.slice(0, EXCERPT_LENGTH);
  const ultimoEspacio = cortado.lastIndexOf(' ');
  const text = ultimoEspacio > EXCERPT_LENGTH / 2 ? cortado.slice(0, ultimoEspacio) : cortado;
  return { text, cut: true };
}

/**
 * **La lámina que se comparte**, hermana de `Poster` (RFC 0002, D13): banda
 * azul de marca con el logo, debajo el título con la pastilla del tipo en su
 * color, la fecha, la anotación recortada a un párrafo cómodo y el
 * recordatorio si sigue pendiente.
 *
 * Todo en estilos en línea y hexadecimales, sin ninguna clase de Tailwind ni
 * imagen remota: el rasterizador mete el nodo en un `<foreignObject>` y ahí
 * no llega ni `oklch` ni una petición de red (`lib/share/rasterize.ts`).
 */
export function JournalEntryCard({
  ref,
  entry,
  churchName,
  continuesLabel,
  reminderLabel,
}: {
  ref?: Ref<HTMLDivElement>;
  entry: JournalEntry;
  churchName: string;
  continuesLabel: string;
  reminderLabel: string;
}) {
  const { t } = useTranslation();
  const { accent, labelKey } = ENTRY_KIND_STYLES[entry.kind];
  const kindLabel = t(labelKey);
  const pillBg = accentHex(accent);
  const pillFg = accentForeground(accent).startsWith('#') ? accentForeground(accent) : '#ffffff';
  const { text: annotation, cut } = excerptFor(entry.annotation);
  const pending = entry.remindAt && !entry.remindDoneAt;

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
        <span style={{ fontSize: '26px', fontWeight: 600 }}>{churchName}</span>
      </div>

      <div style={{ padding: '44px 48px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            style={{
              background: pillBg,
              color: pillFg,
              fontSize: '18px',
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: '999px',
            }}
          >
            {kindLabel}
          </span>
          <span style={{ fontSize: '20px', color: '#5b6577' }}>{formatDay(entry.occurredAt)}</span>
        </div>

        <p style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
          {entry.title}
        </p>

        <p style={{ fontSize: '26px', lineHeight: 1.6, margin: 0 }}>
          {annotation}
          {cut && <span style={{ color: '#5b6577' }}> {continuesLabel}</span>}
        </p>

        {pending && (
          <div
            style={{
              marginTop: '8px',
              padding: '18px 22px',
              borderRadius: '16px',
              background: '#fff7e6',
              color: '#7a4d00',
              fontSize: '22px',
            }}
          >
            <strong>{reminderLabel}</strong>
            {entry.remindAt && <span> · {formatDateTime(entry.remindAt)}</span>}
            {entry.remindText && <span> — {entry.remindText}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
