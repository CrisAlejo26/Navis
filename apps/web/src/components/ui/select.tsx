import { ChevronDown } from 'lucide-react';
import type { ReactNode, SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

type Size = 'sm' | 'md';

const sizes: Record<Size, string> = {
  sm: 'h-9 pl-2.5 pr-8 text-sm',
  md: 'h-11 pl-3.5 pr-9 text-[15px]',
};

// Se omite el `size` nativo (número de filas visibles, que aquí no se usa)
// para poder llamar `size` a la escala del control, como en Button.
interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Etiqueta visible. Sin ella hace falta `aria-label`. */
  label?: string;
  size?: Size;
  children: ReactNode;
}

/**
 * Desplegable nativo con el aspecto del resto de campos. Nativo a propósito:
 * en el teléfono abre el selector del sistema, que se maneja mejor que
 * cualquier lista que pintemos nosotros.
 */
export function Select({ label, size = 'md', className, id, children, ...props }: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="gap-2 flex flex-col">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none rounded-lg border bg-card text-foreground',
            'cursor-pointer transition-[border-color,box-shadow] duration-200 outline-none',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35',
            sizes[size],
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={size === 'sm' ? 14 : 16}
          aria-hidden
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground',
            size === 'sm' ? 'right-2.5' : 'right-3',
          )}
        />
      </div>
    </div>
  );
}
