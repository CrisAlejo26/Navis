import type { InputHTMLAttributes } from 'react';

import { CheckboxControl } from '@/components/ui/checkbox-control';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label: string;
    /** Qué significa esta opción, bajo la etiqueta. */
    hint?: string;
}

/**
 * Casilla con su etiqueta. Va envuelta en el `<label>`, así que se marca
 * pulsando también sobre el texto: el área táctil real es toda la fila y no
 * un cuadradito de 18 px (Regla 5). La casilla en sí es `CheckboxControl`; al
 * marcarla, el texto pasa del gris al color de primer plano.
 */
export function Checkbox({ label, hint, className, ...props }: CheckboxProps) {
    return (
        <label
            className={cn(
                'gap-2.5 py-1.5 text-sm flex cursor-pointer items-start text-muted-foreground transition-colors',
                'has-[input:checked]:text-foreground has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-60',
                className,
            )}
        >
            <CheckboxControl className="mt-px" {...props} />
            <span className="flex flex-col">
                <span>{label}</span>
                {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
            </span>
        </label>
    );
}
