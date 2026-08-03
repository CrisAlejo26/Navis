import { useEffect, type RefObject } from 'react';

/**
 * Cierra un panel al pulsar fuera o al apretar Escape.
 *
 * Es lo que se espera de cualquier menú, y hacerlo bien tiene su detalle —hay
 * que quitar los dos escuchadores al desmontar—, así que vive en un sitio y no
 * copiado en cada desplegable.
 */
export function useOutsideClose(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
): void {
  useEffect(() => {
    if (!open) return;

    const onPointer = (event: MouseEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, open, onClose]);
}
