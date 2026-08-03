import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'brand' | 'accent' | 'muted' | 'outline';

const variants: Record<Variant, string> = {
  brand: 'bg-brand text-brand-foreground',
  accent: 'bg-accent text-accent-foreground',
  muted: 'bg-muted text-muted-foreground',
  outline: 'border bg-transparent text-muted-foreground',
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
  children?: ReactNode;
}

/** Etiqueta corta: un rol, un estado. El color nunca va solo, siempre con texto. */
export function Badge({ variant = 'muted', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'gap-1.5 px-2.5 py-1 text-xs font-medium inline-flex items-center rounded-full',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
