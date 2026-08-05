import type { ReactNode } from 'react';

/**
 * Un botón de icono de una fila de la lista.
 *
 * 36 px y pegados con hueco: los 32 px de `Button size="sm"` son para una barra
 * de escritorio, y aquí van cuatro seguidos donde alguien apunta con el pulgar
 * (Regla 5 §4). La etiqueta es obligatoria y lleva el nombre de la persona
 * dentro: «Subir a Juan Pérez» dice qué va a pasar, «Subir» no.
 */
export function RowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="size-9 inline-flex cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}
