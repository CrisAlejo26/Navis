import { Check, Minus } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Sobre qué fondo va la casilla. `onPrimary` es para la cabecera azul de la tabla:
 * ahí una casilla del color de la interfaz se perdería contra el fondo, y se
 * dibuja clara.
 */
export type CheckboxTone = 'default' | 'onPrimary';

const BOX: Record<CheckboxTone, string> = {
    default: [
        'border-muted-foreground/50 bg-card text-primary-foreground',
        'group-hover:border-primary',
        'peer-checked:border-primary peer-checked:bg-primary',
        'group-data-[indeterminate=true]:border-primary group-data-[indeterminate=true]:bg-primary',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background',
    ].join(' '),
    onPrimary: [
        'border-primary-foreground/70 bg-transparent text-primary',
        'group-hover:border-primary-foreground',
        'peer-checked:border-primary-foreground peer-checked:bg-primary-foreground',
        'group-data-[indeterminate=true]:border-primary-foreground group-data-[indeterminate=true]:bg-primary-foreground',
        'peer-focus-visible:ring-2 peer-focus-visible:ring-primary-foreground peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-primary',
    ].join(' '),
};

interface CheckboxControlProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size'
> {
    /** «Algunas»: se pinta un guion. Quien lo pasa deja `checked` en `false`. */
    indeterminate?: boolean;
    tone?: CheckboxTone;
    /** Agranda el sitio donde se pulsa a 40 px sin agrandar la caja (Regla 5 §4). */
    touch?: boolean;
}

/**
 * La casilla, **solo la casilla**: una caja dibujada con los tokens de la
 * interfaz —se ve igual de bien en claro y en oscuro (Regla 3)— sobre un
 * `<input type="checkbox">` de verdad.
 *
 * El `<input>` va encima, transparente y del mismo tamaño: el clic, el teclado,
 * el foco y el lector de pantalla son los del elemento nativo, sin reimplementar
 * nada. Lo que se ve es la caja de debajo, que reacciona a su estado con las
 * variantes `peer-*` de Tailwind.
 *
 * No lleva etiqueta ni área táctil: quien la usa la envuelve en un `<label>`
 * (`Checkbox`, o la casilla de una fila de tabla), que es quien decide cuánto
 * mide el sitio donde se pulsa (Regla 5 §4).
 */
export function CheckboxControl({
    indeterminate = false,
    tone = 'default',
    touch = false,
    className,
    ...props
}: CheckboxControlProps) {
    return (
        <span
            data-indeterminate={indeterminate || undefined}
            className={cn('group relative inline-flex size-[18px] shrink-0', className)}
        >
            <input
                type="checkbox"
                ref={(element) => {
                    if (element) element.indeterminate = indeterminate;
                }}
                className="peer inset-0 m-0 absolute z-10 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                {...props}
            />
            <span
                aria-hidden
                className={cn(
                    'grid size-full place-items-center rounded-[5px] border-[1.5px]',
                    'transition-[background-color,border-color,box-shadow] duration-150 motion-reduce:transition-none',
                    'peer-disabled:opacity-40',
                    BOX[tone],
                )}
            >
                <Check
                    strokeWidth={3}
                    className="size-3 col-start-1 row-start-1 scale-50 opacity-0 transition-[opacity,transform] duration-150 group-has-[input:checked]:scale-100 group-has-[input:checked]:opacity-100 group-data-[indeterminate=true]:hidden motion-reduce:transition-none"
                />
                <Minus
                    strokeWidth={3}
                    className="size-3 col-start-1 row-start-1 hidden group-data-[indeterminate=true]:block"
                />
            </span>
        </span>
    );
}
