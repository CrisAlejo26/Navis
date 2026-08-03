import { TriangleAlert } from 'lucide-react';

/**
 * Error del servidor en un formulario. Va con `role="alert"` para que el lector
 * de pantalla lo anuncie al aparecer, y con icono además del color, que por sí
 * solo no informa (Regla 3).
 */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <p
      role="alert"
      className="gap-2.5 px-3.5 py-3 text-sm flex items-start rounded-lg border border-destructive/40 bg-destructive/10 text-destructive"
    >
      <TriangleAlert size={16} aria-hidden className="mt-0.5 shrink-0" />
      {message}
    </p>
  );
}
