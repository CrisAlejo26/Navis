import { churchIcon } from '@/lib/church-icon';
import { cn } from '@/lib/cn';

/**
 * Las clases van escritas enteras: Tailwind escanea el código en busca de
 * literales, y una compuesta con una plantilla (`` `bg-church-${tinte}` ``) no
 * la encontraría — se quedaría sin generar y el fondo saldría transparente.
 */
const TINTES: Record<number, string> = {
  1: 'bg-church-1 text-church-1-foreground',
  2: 'bg-church-2 text-church-2-foreground',
  3: 'bg-church-3 text-church-3-foreground',
  4: 'bg-church-4 text-church-4-foreground',
  5: 'bg-church-5 text-church-5-foreground',
  6: 'bg-church-6 text-church-6-foreground',
};

/**
 * La insignia de una iglesia: su icono náutico, en el tinte que le tocó por
 * su id (Regla 9 §3).
 *
 * Es lo único de la barra lateral que cambia al cambiar de espacio de
 * trabajo, y por eso lleva el color: la activa va sobre su tinte propio y las
 * de la lista, apagadas, para que solo destaque una — y para que, entre
 * varias apagadas, se distingan igual por el dibujo del icono.
 */
export function ChurchBadge({
  id,
  name,
  muted = false,
  className,
}: {
  id: string;
  /** Solo para la etiqueta accesible: el icono ya no depende del nombre. */
  name: string;
  /** Apagada, para las que no son la activa. */
  muted?: boolean;
  className?: string;
}) {
  const { Icon, tinte } = churchIcon(id);

  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        'h-6 w-6 flex shrink-0 items-center justify-center rounded-md',
        muted ? 'bg-muted text-muted-foreground' : (TINTES[tinte] ?? TINTES[1]),
        className,
      )}
    >
      <Icon size={14} aria-hidden />
    </span>
  );
}
