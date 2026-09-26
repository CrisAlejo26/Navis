import type { ComponentProps } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ICON_TONE_BUTTON, type IconActionTone } from '@/lib/icon-tones';

export type { IconActionTone };

/**
 * Un botón de solo icono de una fila o de una barra, con el color de lo que hace:
 * editar y abrir en el azul de la interfaz, borrar en rojo, lo que pide cuidado
 * en ámbar y lo que confirma en verde. El color **refuerza**, no informa solo:
 * cada botón lleva su icono y su etiqueta accesible.
 */
export function IconAction({
    tone,
    className,
    ...props
}: Omit<ComponentProps<typeof Button>, 'variant' | 'size'> & { tone: IconActionTone }) {
    return (
        <Button
            variant="ghost"
            size="icon"
            className={cn(ICON_TONE_BUTTON[tone], className)}
            {...props}
        />
    );
}
