import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

/**
 * Casilla con su etiqueta. Va envuelta en el `<label>`, así que se marca
 * pulsando también sobre el texto: el área táctil real es toda la fila y no
 * un cuadradito de 16 px (Regla 5).
 */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className="gap-2.5 py-1 text-sm flex cursor-pointer items-center text-muted-foreground">
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded shrink-0 cursor-pointer accent-primary',
          'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          className,
        )}
        {...props}
      />
      {label}
    </label>
  );
}
