import { CheckboxControl } from '@/components/ui/checkbox-control';

/**
 * La casilla de una fila (o la de «seleccionar todo»), con un área táctil de
 * 40 px: el cuadrito es demasiado poco para acertar con el pulgar (Regla 5 §4).
 * `indeterminate` es el estado de «algunas de esta página».
 */
export function SelectionCheckbox({
    checked,
    indeterminate = false,
    disabled = false,
    label,
    onSolid = false,
    onChange,
}: {
    checked: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    /** Nombre accesible: sin él, una casilla suelta no dice de qué es. */
    label: string;
    /** Sobre la cabecera azul: la casilla se pinta clara para que se vea. */
    onSolid?: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <span className="size-10 inline-flex items-center justify-center">
            <CheckboxControl
                touch
                checked={checked}
                indeterminate={indeterminate}
                disabled={disabled}
                aria-label={label}
                tone={onSolid ? 'onPrimary' : 'default'}
                onChange={(event) => {
                    onChange(event.target.checked);
                }}
            />
        </span>
    );
}
