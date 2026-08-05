import { useEffect, useState, type RefObject } from 'react';

import { nodeToPng } from '@/lib/share/rasterize';

export interface PosterImage {
  blob: Blob | null;
  url: string | null;
  failed: boolean;
}

/**
 * Convierte la lámina en PNG y devuelve también su URL para enseñarla.
 *
 * La vista previa **es** la imagen que se va a mandar, no una maqueta a
 * escala: se rasteriza una vez, se enseña ese PNG y ese mismo es el que sale
 * por compartir, portapapeles o descarga. De paso, si el navegador no sabe
 * rasterizar, se sabe al abrir la hoja y no al pulsar «Enviar».
 */
export function usePosterImage(
  poster: RefObject<HTMLElement | null>,
  /** Cambia cuando cambia lo que hay que pintar: tramo, formato o tema. */
  signature: string,
): PosterImage {
  const [image, setImage] = useState<PosterImage>({ blob: null, url: null, failed: false });

  useEffect(() => {
    const node = poster.current;
    if (!node) return;

    let vigente = true;
    let creada: string | null = null;

    // Un respiro para que el navegador termine de maquetar la lámina —y de
    // decodificar el logo— antes de fotografiarla.
    const timer = setTimeout(() => {
      /*
       * Al **triple** de escala: la lámina se mira en un teléfono y se amplía
       * con los dedos, y ahí un PNG justo de píxeles se deshace. Pesa más, pero
       * es lo que se manda una vez y se lee muchas.
       */
      void nodeToPng(node, 3)
        .then((blob) => {
          if (!vigente) return;
          creada = URL.createObjectURL(blob);
          setImage({ blob, url: creada, failed: false });
        })
        .catch(() => {
          if (vigente) setImage({ blob: null, url: null, failed: true });
        });
    }, 120);

    return () => {
      vigente = false;
      clearTimeout(timer);
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [poster, signature]);

  return image;
}
