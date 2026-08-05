import type { ReactNode } from 'react';

import { accentVars } from '@/lib/accents';

/**
 * **La banda de color a sangre** de la página pública (RFC 0010 §8.6).
 *
 * En un teléfono ocupa cerca de media pantalla, y esa tipografía es la decisión
 * que hace que la página no parezca la aplicación: en el panel todo es
 * informativo y comedido; aquí es **un cartel**.
 *
 * La banda **es la misma en los dos temas**, porque es el color de la lista y
 * ese no cambia (Regla 3 §6). Se reutiliza tal cual en la puerta: quien tiene el
 * enlace ya sabe a qué lista va (D38).
 */
export function PublicBand({
  churchName,
  name,
  accent,
  children,
}: {
  churchName: string;
  name: string;
  accent: string;
  /** La línea de «12 personas · actualizada el 3 de agosto», o la descripción. */
  children?: ReactNode;
}) {
  return (
    <header
      style={accentVars(accent)}
      className="px-6 py-14 sm:px-10 sm:py-20 bg-[var(--acento)] text-[var(--acento-fg)]"
    >
      <div className="max-w-3xl mx-auto">
        <p className="font-semibold text-[11px] tracking-[0.28em] uppercase opacity-80">
          {churchName}
        </p>

        {/* Más grande que cualquier titular del panel, y con el `clamp` que lo
            baja a 375 px sin que se rompa en alemán (Reglas 2 y 5). */}
        <h1
          className="mt-3 font-semibold leading-[0.95] tracking-[-0.04em]"
          style={{ fontSize: 'clamp(2.5rem, 9vw, 4.5rem)' }}
        >
          {name}
        </h1>

        {children && <div className="mt-4 text-sm opacity-85">{children}</div>}
      </div>
    </header>
  );
}
