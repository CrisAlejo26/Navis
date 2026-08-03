import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  // 48 px: el tamaño de la acción principal en una pantalla táctil (Regla 5).
  lg: 'h-12 px-6 text-[15px]',
  icon: 'h-10 w-10',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Muestra un indicador y bloquea el botón mientras la acción está en curso. */
  isLoading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'gap-2 font-medium inline-flex cursor-pointer items-center justify-center rounded-lg',
        'transition-[transform,opacity,background-color] duration-200 active:scale-[0.985]',
        'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {/* El giro acompaña, no informa: quien no ve movimiento sigue teniendo el
          texto del botón, que ya cambia a «Entrando…» (Regla 3). */}
      {isLoading && <Loader2 size={16} aria-hidden className="animate-spin" />}
      {children}
    </button>
  );
}
