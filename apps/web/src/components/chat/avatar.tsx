import { cn } from '@/lib/cn';

/**
 * Cinco combinaciones ya existentes en el sistema de tokens, nunca un color
 * aleatorio en hexadecimal (RFC 0016 §5): mismo criterio que un «mapa de
 * variantes» (Regla 1 §3). La posición sale del id de la cuenta, así que la
 * misma persona siempre tiene el mismo color.
 */
const VARIANTS = [
  'bg-primary/15 text-primary',
  'bg-success/15 text-success',
  'bg-warning/15 text-warning',
  'bg-accent text-accent-foreground',
  'bg-secondary text-secondary-foreground',
] as const;

function variantFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash + id.charCodeAt(i)) % VARIANTS.length;
  return VARIANTS[hash] ?? VARIANTS[0];
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '';
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase() || '?';
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
} as const;

export function ChatAvatar({
  id,
  name,
  image,
  size = 'md',
  className,
}: {
  id: string;
  name: string;
  image?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  if (image) {
    return (
      <img
        src={image}
        alt=""
        className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        'font-semibold inline-flex shrink-0 items-center justify-center rounded-full',
        SIZES[size],
        variantFor(id),
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
