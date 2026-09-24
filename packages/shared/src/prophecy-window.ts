import { addDays } from './dates';
import type { ProphecyWindow } from './schemas/prophecy-queries';

/**
 * El primer día de la ventana de tiempo del filtro de profecías (RFC 0004
 * D12), o `null` si es «todo». Compartida entre la API y el repositorio local
 * del móvil (docs/profecias-movil-plan.md §4.3): con dos usos reales ya no
 * merece la pena duplicarla.
 */
export function windowStart(window: ProphecyWindow, today: string): string | null {
  if (window === '7d') return addDays(today, -7);
  if (window === '30d') return addDays(today, -30);
  if (window === 'year') return `${today.slice(0, 4)}-01-01`;
  return null;
}
