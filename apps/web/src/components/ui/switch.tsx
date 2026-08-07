import type { ButtonHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onChange: () => void;
}

/**
 * Interruptor de dos estados. `role="switch"` en vez de una casilla: no es
 * «marcado, sin marcar» sino «encendido, apagado», y el lector de pantalla lo
 * anuncia distinto.
 */
export function Switch({ checked, onChange, disabled, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'h-6 w-11 relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200',
        'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'h-5 w-5 inline-block rounded-full bg-background transition-transform duration-200',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}
