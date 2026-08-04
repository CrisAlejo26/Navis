import { useCallback, type KeyboardEvent, type RefObject } from 'react';

/**
 * Moverse por la rejilla con las flechas.
 *
 * Programar un mes entero se tiene que poder hacer **solo con el teclado**
 * (Regla 9 §5), y con `Tab` a secas harían falta cuarenta pulsaciones para
 * cruzar el mes. Se buscan los días en el DOM en vez de llevar una lista
 * aparte: el orden visual y el del documento son el mismo, y así no hay dos
 * fuentes de verdad que se desincronicen.
 */
export function useArrowKeys(
  container: RefObject<HTMLElement | null>,
  columns: number,
): (event: KeyboardEvent<HTMLElement>) => void {
  return useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      const steps: Record<string, number> = {
        ArrowLeft: -1,
        ArrowRight: 1,
        ArrowUp: -columns,
        ArrowDown: columns,
      };

      const step = steps[event.key];
      const isEdge = event.key === 'Home' || event.key === 'End';
      if (step === undefined && !isEdge) return;

      const days = [
        ...(container.current?.querySelectorAll<HTMLElement>('[data-day-button]') ?? []),
      ];
      const current = days.indexOf(document.activeElement as HTMLElement);
      if (current < 0) return;

      event.preventDefault();
      const target = isEdge
        ? event.key === 'Home'
          ? 0
          : days.length - 1
        : Math.min(Math.max(current + (step ?? 0), 0), days.length - 1);

      days[target]?.focus();
    },
    [columns, container],
  );
}
