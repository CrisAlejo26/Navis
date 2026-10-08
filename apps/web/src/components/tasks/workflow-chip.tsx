import type { WorkflowRef } from '@navis/shared';
import { Compass } from 'lucide-react';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * Un flujo de trabajo pintado: su brújula y su color, con el nombre escrito
 * (Regla 3 §7: el color nunca informa solo). Parecido a la etiqueta, pero con
 * otro icono fijo para que no se confundan de un vistazo.
 */
export function WorkflowChip({
    workflow,
    size = 'md',
}: {
    workflow: Pick<WorkflowRef, 'name' | 'accent'>;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            style={accentVars(workflow.accent)}
            className={cn(
                'gap-1 font-medium inline-flex items-center rounded-md border',
                'border-[color-mix(in_oklab,var(--acento)_35%,transparent)] bg-[color-mix(in_oklab,var(--acento)_14%,transparent)] text-[var(--acento)]',
                size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
            )}
        >
            <Compass size={size === 'sm' ? 11 : 12} aria-hidden />
            {workflow.name}
        </span>
    );
}
