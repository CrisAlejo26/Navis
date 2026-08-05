import { believerPhotoPath } from '@navis/shared';

import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-20',
} as const;

/**
 * La fotografía de un creyente, si la tiene.
 *
 * **Devuelve nada cuando no la hay**, y eso es la decisión: nada de círculos
 * con iniciales de color al azar. Un avatar inventado compite justo con los dos
 * colores que aquí sí significan algo —el del don y el de la sonda— y llena la
 * pantalla de ruido para la mayoría, que no va a subir ninguna foto (§7.1).
 *
 * `crossOrigin="use-credentials"` no es decorativo: la API está en otro origen
 * y el guard de iglesia mira la cookie. Sin eso el navegador pide la imagen
 * **sin cookie** y recibe un 401.
 *
 * `alt` vacío a propósito: el nombre va siempre al lado, y repetirlo en el alt
 * hace que un lector de pantalla lo diga dos veces.
 */
export function BelieverPhoto({
  believer,
  size = 'sm',
  className,
}: {
  believer: { id: string; hasPhoto: boolean };
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (!believer.hasPhoto) return null;

  return (
    <img
      alt=""
      loading="lazy"
      crossOrigin="use-credentials"
      src={`${api.baseUrl}${believerPhotoPath(believer.id)}`}
      // `max-w-none` frente al `max-width: 100%` del reset: dentro de una celda
      // estrecha, ese tope encoge la foto a nada de ancho y deja solo el alto.
      className={cn('max-w-none shrink-0 rounded-full border object-cover', SIZES[size], className)}
    />
  );
}
