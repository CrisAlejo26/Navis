import { useEffect, useMemo } from 'react';

/**
 * Escuchar un audio **antes** de subirlo.
 *
 * Sin esto, quien acaba de grabar medio dormido guardaba a ciegas y no sabía si
 * se le había oído hasta abrir la ficha. Aquí se oye, y si no vale se quita.
 *
 * La URL se crea con `useMemo` y no dentro de un efecto con `setState`: lo
 * segundo pinta una vez sin reproductor y vuelve a pintar, que es la cascada
 * de renders que avisa el linter. El efecto queda solo para **revocarla**:
 * cada URL de objeto retiene el fichero entero en memoria, y grabar cinco veces
 * seguidas dejaría los cinco colgados hasta recargar la página.
 */
export function PendingAudioPlayer({ blob }: { blob: Blob }) {
  const src = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(
    () => () => {
      URL.revokeObjectURL(src);
    },
    [src],
  );

  return (
    <audio controls preload="metadata" src={src} className="h-9 min-w-0 w-full">
      <track kind="captions" />
    </audio>
  );
}
