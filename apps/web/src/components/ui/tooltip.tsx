import {
    cloneElement,
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';

/** Lo que se espera antes de enseñarlo al pasar el cursor: que no salte al cruzar la barra. */
const HOVER_DELAY_MS = 450;
const GAP = 8;
const MARGIN = 8;

/**
 * Una ayuda breve junto a un control: aparece al pasar el cursor y al enfocarlo
 * con el teclado, y se lee como descripción del control (`aria-describedby`).
 *
 * Se pinta **en el `body`**, con posición fija y colores de panel (`popover`):
 *
 * - Fuera del árbol, ningún contenedor con `overflow-hidden` (la tarjeta de la
 *   tabla, sin ir más lejos) lo puede recortar.
 * - Se recoloca para no salirse de la pantalla por ningún lado y, si no cabe
 *   debajo, sube encima del control.
 * - Con los tokens de panel se ve igual de suave en claro y en oscuro; un fondo
 *   `foreground` invertido era un bloque negro sobre una interfaz clara (Regla 3).
 *
 * Es un **complemento**, nunca el nombre: en un teléfono no hay «pasar por
 * encima», así que lo que un botón necesita para entenderse va en su propio
 * texto o `aria-label` (Regla 5).
 */
export function Tooltip({
    label,
    description,
    children,
}: {
    label: string;
    /** Una frase que explica qué hace el control, bajo el título. */
    description?: string;
    /** Un único elemento: recibe el `aria-describedby`. */
    children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
    const id = useId();
    const [open, setOpen] = useState(false);
    const [style, setStyle] = useState<CSSProperties | undefined>(undefined);
    const anchor = useRef<HTMLSpanElement>(null);
    const tip = useRef<HTMLDivElement>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const show = useCallback((delay: number) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            setOpen(true);
        }, delay);
    }, []);
    const hide = useCallback(() => {
        clearTimeout(timer.current);
        setOpen(false);
        setStyle(undefined);
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        const trigger = anchor.current?.getBoundingClientRect();
        const box = tip.current?.getBoundingClientRect();
        if (!trigger || !box) return;

        const below = trigger.bottom + GAP + box.height <= window.innerHeight - MARGIN;
        setStyle({
            position: 'fixed',
            top: below ? trigger.bottom + GAP : Math.max(MARGIN, trigger.top - GAP - box.height),
            left: Math.max(MARGIN, Math.min(trigger.left, window.innerWidth - box.width - MARGIN)),
        });
    }, [open, label, description]);

    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') hide();
        };
        document.addEventListener('keydown', onKey);
        window.addEventListener('scroll', hide, { capture: true, passive: true });
        return () => {
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', hide, { capture: true });
        };
    }, [open, hide]);

    useEffect(
        () => () => {
            clearTimeout(timer.current);
        },
        [],
    );

    return (
        <span
            ref={anchor}
            className="inline-flex"
            onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') show(HOVER_DELAY_MS);
            }}
            onPointerLeave={hide}
            // Solo el foco de teclado: al pulsar con el ratón el control ya hizo lo suyo
            // (abrir un panel, p. ej.) y la ayuda taparía justo lo que se ha abierto.
            onFocus={(event) => {
                if (event.target.matches(':focus-visible')) show(0);
            }}
            onPointerDown={hide}
            onBlur={hide}
        >
            {cloneElement(children, { 'aria-describedby': open ? id : undefined })}
            {open &&
                createPortal(
                    <div
                        ref={tip}
                        id={id}
                        role="tooltip"
                        style={
                            style ?? { position: 'fixed', top: 0, left: 0, visibility: 'hidden' }
                        }
                        className="px-3 py-2 text-xs shadow-lg max-w-72 pointer-events-none z-[60] w-max rounded-lg border bg-popover text-popover-foreground"
                    >
                        <span className="font-semibold block">{label}</span>
                        {description && (
                            <span className="mt-0.5 leading-snug block text-muted-foreground">
                                {description}
                            </span>
                        )}
                    </div>,
                    document.body,
                )}
        </span>
    );
}
