import { Logo } from '@/components/logo';
import { LoadingMessage } from '@/components/ui/loading-message';
import { cn } from '@/lib/cn';

type Size = 'sm' | 'md' | 'lg';
/** Sobre el fondo normal de la aplicación, o sobre el azul de la marca. */
type Tone = 'default' | 'brand';

const SCENE: Record<Size, string> = {
  sm: 'h-16 w-28',
  md: 'h-24 w-40',
  lg: 'h-32 w-56',
};

const SHIP: Record<Size, string> = {
  sm: 'h-7 w-7',
  md: 'h-11 w-11',
  lg: 'h-16 w-16',
};

/**
 * Una ola. Empieza y acaba a la misma altura y con la misma pendiente, así que
 * la banda se pega consigo misma: se pinta dos veces y se desplaza media
 * anchura, con lo que el bucle no tiene costura.
 *
 * La curva es suave a propósito: con crestas pronunciadas el barco parecía
 * saltar en vez de mecerse. El color es `currentColor`, para que la ola se tiña
 * con el del contenedor y valga igual sobre el fondo claro que sobre el azul.
 */
function Swell({ className, opacity }: { className: string; opacity: number }) {
  return (
    <div className={cn('inset-x-0 bottom-0 absolute flex w-[200%]', className)}>
      {[0, 1].map((copy) => (
        <svg
          key={copy}
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="h-full w-1/2 shrink-0"
          fill="currentColor"
          fillOpacity={opacity}
        >
          <path d="M0 12 C 20 7 30 17 50 12 C 70 7 80 17 100 12 L100 24 L0 24 Z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * El cargador de Navis: el barco de la marca meciéndose entre dos olas.
 *
 * Es el elemento firma de la espera (Regla 9). Se reserva para las esperas
 * largas —la sesión al arrancar, una pantalla entera—; para lo que tarda poco
 * están los esqueletos, que no distraen.
 *
 * El casco queda **detrás** de la ola de delante, que es lo que hace que el
 * barco se vea flotando y no colgado en el aire. El balanceo dura lo mismo que
 * pasa una ola, así que los dos movimientos van a compás.
 *
 * Solo se mueve `transform`, y con `prefers-reduced-motion` se queda quieto:
 * el mensaje, que es lo que informa, se sigue leyendo igual.
 */
export function ShipLoader({
  label,
  size = 'md',
  tone = 'default',
  className,
}: {
  /** Un texto fijo en lugar de los mensajes que van pasando. */
  label?: string;
  size?: Size;
  tone?: Tone;
  className?: string;
}) {
  const onBrand = tone === 'brand';
  const text = onBrand ? 'text-brand-foreground/75' : 'text-muted-foreground';

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'gap-4 flex flex-col items-center',
        onBrand ? 'text-brand-foreground' : 'text-primary',
        className,
      )}
    >
      <div className={cn('relative overflow-hidden', SCENE[size])}>
        {/* Ola de fondo: más alta y más apagada, para dar profundidad. */}
        <Swell className="animate-swell-slow h-[55%]" opacity={onBrand ? 0.2 : 0.16} />

        {/* El barco, entre las dos olas: la de delante le tapa el casco. */}
        <div className="inset-x-0 absolute bottom-[26%] flex justify-center">
          <Logo variante={onBrand ? 'blanco' : 'auto'} className={cn('animate-bob', SHIP[size])} />
        </div>

        <Swell className="animate-swell h-[38%]" opacity={onBrand ? 0.45 : 0.36} />
      </div>

      {label ? <p className={cn('text-sm', text)}>{label}</p> : <LoadingMessage className={text} />}
    </div>
  );
}
