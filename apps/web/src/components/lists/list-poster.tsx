import type { PublicListMember } from '@navis/shared';
import type { Ref } from 'react';

import { accentForeground, accentHex } from '@/lib/accents';

export const POSTER_WIDTH = 1200;
export const POSTER_HEIGHT = 630;

/**
 * **La lámina que se rasteriza**: la portada de la tarjeta y lo que se descarga
 * (RFC 0010 D18, D39).
 *
 * Todo va en **estilos en línea y hexadecimales**: el rasterizador mete el nodo
 * en un `<foreignObject>` y ahí no llegan ni las clases de Tailwind ni `oklch`
 * (`rasterize.ts`). Y sin ninguna imagen remota: las fotos no entran en la
 * lámina, que es la forma más simple de cumplir «autocontenido».
 *
 * En **modo restringido la portada es otra**: el color, el nombre de la iglesia,
 * el de la lista y una línea diciendo que hace falta acceso. Ni un nombre, ni el
 * número de personas (D18).
 */
export function ListPoster({
  ref,
  churchName,
  name,
  accent,
  members,
  locked,
  lockedLabel,
}: {
  ref?: Ref<HTMLDivElement>;
  churchName: string;
  name: string;
  accent: string;
  members: readonly PublicListMember[];
  locked: boolean;
  lockedLabel: string;
}) {
  const fondo = accentHex(accent);
  const tinta = accentForeground(accent).startsWith('#') ? accentForeground(accent) : '#ffffff';

  return (
    <div
      ref={ref}
      style={{
        width: `${String(POSTER_WIDTH)}px`,
        height: `${String(POSTER_HEIGHT)}px`,
        backgroundColor: fondo,
        color: tinta,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '56px 64px',
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <p
          style={{
            fontSize: '20px',
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            opacity: 0.8,
          }}
        >
          {churchName}
        </p>
        <p
          style={{ fontSize: '84px', fontWeight: 700, letterSpacing: '-0.04em', marginTop: '12px' }}
        >
          {name}
        </p>
      </div>

      {locked ? (
        <p style={{ fontSize: '28px', opacity: 0.85 }}>{lockedLabel}</p>
      ) : (
        <ol
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px 40px',
            fontSize: '26px',
            lineHeight: 1.4,
            margin: 0,
            padding: 0,
            listStyle: 'none',
            maxHeight: '320px',
            overflow: 'hidden',
          }}
        >
          {members.map((member) => (
            <li
              key={`${String(member.position)}-${member.name}`}
              style={{ display: 'flex', gap: '12px' }}
            >
              <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
                {member.position + 1}
              </span>
              <span>{member.name}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
