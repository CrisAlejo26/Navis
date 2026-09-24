import {
    useCallback,
    useLayoutEffect,
    type CSSProperties,
    type ReactNode,
    type RefObject,
} from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/cn';

/**
 * Un panel flotante anclado a un elemento, en el `document.body`.
 *
 * Va por **portal y posición fija**, no por `absolute` bajo su disparador:
 * la tabla desplaza a lo ancho dentro de su tarjeta (`overflow-x-auto`) y un
 * panel absoluto se recortaría — CLAUDE.md, «un hijo ancho dentro de un
 * `flex-col` ensancha al padre». Fuera del árbol, el recorte no le afecta.
 *
 * Cierra con Escape y con un clic fuera, y con el scroll **se recoloca**: un
 * panel anclado a una celda que se queda flotando mientras el contenido se
 * mueve es un panel mentiroso.
 */
export function FloatingPanel({
    anchorRef,
    open,
    onClose,
    label,
    width = 288,
    className,
    children,
}: {
    /** El elemento bajo el que se coloca. */
    anchorRef: RefObject<HTMLElement | null>;
    open: boolean;
    onClose: () => void;
    /** Nombre accesible del diálogo (la columna que se está filtrando). */
    label: string;
    /** Ancho fijo en píxeles; sirve también para no salirse por la derecha. */
    width?: number;
    className?: string;
    children?: ReactNode;
}) {
    const panel = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<CSSProperties | undefined>(undefined);

    const colocar = useCallback(() => {
        const rect = anchorRef.current?.getBoundingClientRect();
        if (!rect) return;
        setStyle({
            position: 'fixed',
            top: Math.min(rect.bottom + 6, window.innerHeight - 40),
            left: Math.min(rect.left, window.innerWidth - width - 8),
            width,
        });
    }, [anchorRef, width]);

    // Colocar al abrir y **seguir al ancla** al desplazarse: un panel anclado a
    // una celda que se queda flotando mientras el contenido se mueve es un
    // panel mentiroso, y cerrarse con el scroll mataría la apertura en móvil,
    // donde llega el scroll de llevar la toolbar a la vista.
    useLayoutEffect(() => {
        if (!open) return;
        colocar();
    }, [colocar, open]);

    useEffect(() => {
        if (!open) return;

        const close = (event: Event) => {
            if (event instanceof KeyboardEvent) {
                if (event.key === 'Escape') onClose();
                return;
            }
            // El clic dentro del panel y el del propio disparador no cierran: el
            // segundo lo cierra él, al conmutar su estado.
            const target = event.target as Node;
            if (panel.current?.contains(target) || anchorRef.current?.contains(target)) return;
            onClose();
        };

        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', close);
        window.addEventListener('resize', colocar);
        window.addEventListener('scroll', colocar, { capture: true, passive: true });

        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', close);
            window.removeEventListener('resize', colocar);
            window.removeEventListener('scroll', colocar, { capture: true });
        };
    }, [anchorRef, colocar, onClose, open]);

    if (!open || !style) return null;

    return createPortal(
        <div
            ref={panel}
            role="dialog"
            aria-label={label}
            style={style}
            className={cn(
                'shadow-lg animate-chip-in z-50 rounded-xl border bg-popover text-popover-foreground',
                className,
            )}
        >
            {children}
        </div>,
        document.body,
    );
}
