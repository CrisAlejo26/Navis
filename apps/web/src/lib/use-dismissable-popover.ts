import { useEffect, useRef, type RefObject } from 'react';

/**
 * Cierra un menú o popover con `Escape` o al pulsar fuera de su contenedor.
 *
 * Lo hacían `MessageMenu` y `ReactionPicker` cada uno a su manera; el picker
 * de emoji y la barra de formato lo necesitan igual — a la tercera se extrae
 * (Regla 1 §5).
 */
export function useDismissablePopover<T extends HTMLElement>(
  open: boolean,
  onClose: () => void,
): RefObject<T | null> {
  const box = useRef<T>(null);

  useEffect(() => {
    if (!open) return;

    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      if (event.type === 'pointerdown' && box.current?.contains(event.target as Node)) return;
      onClose();
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open, onClose]);

  return box;
}
