import type { ComponentProps } from 'react';
import { Link } from 'react-router';

import { cn } from '@/lib/cn';

/**
 * Enlace dentro de un texto. Se subraya al pasar por encima y al recibir el
 * foco, no siempre: el color de marca ya lo distingue del párrafo, y un
 * subrayado permanente en mitad de una frase la parte.
 */
export function TextLink({ className, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        'font-medium text-primary underline-offset-4 transition-colors duration-200',
        'hover:underline focus-visible:underline',
        className,
      )}
      {...props}
    />
  );
}
