import { useCallback, useState } from 'react';

/**
 * Qué filas están marcadas para exportar en lote (D12).
 *
 * Es el primer sitio del proyecto con selección por casillas: ni profecías,
 * ni sueños, ni creyentes la tienen todavía, así que no hay nada que reusar.
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
