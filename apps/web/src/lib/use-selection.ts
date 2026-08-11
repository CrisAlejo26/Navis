import { useCallback, useState } from 'react';

/**
 * Qué filas están marcadas para una acción en lote (exportar, hoy en
 * `journal` y `chat`). Nacida en `lib/journal` (RFC 0017 D12); se sube aquí
 * en cuanto Comunicaciones la necesita también (Regla 1 §5: a la segunda vez
 * se mira, y esta ya no tenía nada específico de un cuaderno).
 */
export function useSelection() {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  return { selected, toggle, clear, count: selected.size };
}
