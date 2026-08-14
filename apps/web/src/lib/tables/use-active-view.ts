import type { CustomTableView } from '@navis/shared';
import { useSearchParams } from 'react-router';

/** La vista de cuadrícula no tiene fila propia: se sintetiza aquí (D24). */
export const GRID_VIEW = 'grid';

/**
 * Qué vista está abierta, en la URL: un enlace a «Por estado» se puede pegar
 * en un mensaje, igual que la pestaña de una lista (RFC 0010 §8.3).
 */
export function useActiveView(views: readonly CustomTableView[]): {
  activeId: string;
  active: CustomTableView | undefined;
  setActiveId: (id: string) => void;
} {
  const [params, setParams] = useSearchParams();
  const requested = params.get('view') ?? GRID_VIEW;
  const active = views.find((one) => one.id === requested);
  const activeId = requested === GRID_VIEW || active ? requested : GRID_VIEW;

  const setActiveId = (id: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id === GRID_VIEW) next.delete('view');
        else next.set('view', id);
        return next;
      },
      { replace: true },
    );
  };

  return { activeId, active, setActiveId };
}
