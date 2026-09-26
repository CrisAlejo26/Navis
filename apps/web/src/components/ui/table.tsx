import { ChevronDown } from 'lucide-react';
import type { HTMLAttributes, MouseEvent, ReactNode, ThHTMLAttributes } from 'react';

import { cn } from '@/lib/cn';

/**
 * Piezas de tabla de Navis. Son primitivas: cada pantalla compone las suyas
 * con estas, en vez de escribir su propio `<table>` con sus propias clases.
 *
 * La tabla siempre va dentro de `TableScroll`, que le da su propio scroll
 * horizontal: lo que no cabe se desplaza dentro de la tarjeta y nunca arrastra
 * la página entera (Regla 5).
 */
export function TableScroll({ children }: { children: ReactNode }) {
    return <div className="w-full overflow-x-auto">{children}</div>;
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
    return <table className={cn('text-sm w-full border-collapse', className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <thead className={cn('border-b bg-muted/40', className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
    return <tbody className={cn('divide-y', className)} {...props} />;
}

/**
 * Fila. Al pasar por encima se enciende una barra fina a la izquierda en vez
 * de teñir el fondo entero: se ve igual en claro y en oscuro, y no compite con
 * el contenido.
 */
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
    return (
        <tr
            className={cn(
                'border-l-2 border-l-transparent transition-colors duration-150',
                'hover:border-l-primary hover:bg-muted/40',
                className,
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn('px-4 py-3 align-middle', className)} {...props} />;
}

interface HeaderProps extends ThHTMLAttributes<HTMLTableCellElement> {
    /** Sentido actual si esta columna es por la que se ordena ahora mismo. */
    sorted?: 'asc' | 'desc' | false;
    /** Sin él, la cabecera es una etiqueta y no un botón. Recibe el clic: Mayús suma criterio. */
    onSort?: (event: MouseEvent<HTMLButtonElement>) => void;
    /** Texto accesible del botón de ordenar, ya traducido. */
    sortLabel?: string;
    /** Ayuda al pasar el cursor por el botón (p. ej. «Mayús + clic suma otro criterio»). */
    sortHint?: string;
    /** Posición de esta columna entre varios criterios de orden; solo se pinta si hay más de uno. */
    sortPriority?: number;
    /** `solid`: sobre el fondo azul de la cabecera de `DataTable` (texto claro). */
    tone?: 'default' | 'solid';
    /** A la derecha, para las columnas de números: la cabecera sigue a sus celdas. */
    align?: 'left' | 'right';
    /** Lo que va pegado a la etiqueta — el botón de filtro de columna (D1). */
    filter?: ReactNode;
}

export function TableHeader({
    sorted = false,
    onSort,
    sortLabel,
    sortHint,
    sortPriority,
    align = 'left',
    tone = 'default',
    filter,
    className,
    children,
    ...props
}: HeaderProps) {
    const label = (
        <span
            className={cn(
                'font-semibold text-[11px] tracking-[0.08em] uppercase',
                tone === 'solid' ? 'text-primary-foreground' : 'text-muted-foreground',
            )}
        >
            {children}
        </span>
    );

    return (
        <th
            scope="col"
            aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
            className={cn(
                'px-4 py-3 font-medium whitespace-nowrap',
                align === 'right' ? 'text-right' : 'text-left',
                className,
            )}
            {...props}
        >
            <div className={cn('gap-1 flex items-center', align === 'right' && 'justify-end')}>
                {onSort ? (
                    <button
                        type="button"
                        onClick={onSort}
                        aria-label={sortLabel}
                        title={sortHint}
                        // Mayús + clic suma criterio, pero el navegador lo lee como «extender la
                        // selección» y subraya media tabla.
                        onMouseDown={(event) => {
                            if (event.shiftKey) event.preventDefault();
                        }}
                        className={cn(
                            'gap-1.5 inline-flex cursor-pointer items-center rounded-sm',
                            tone === 'solid'
                                ? 'hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:outline-none'
                                : 'hover:text-foreground',
                        )}
                    >
                        {label}
                        <ChevronDown
                            size={13}
                            aria-hidden
                            className={cn(
                                'transition-[transform,opacity] duration-200',
                                sorted
                                    ? tone === 'solid'
                                        ? 'text-primary-foreground opacity-100'
                                        : 'text-foreground opacity-100'
                                    : tone === 'solid'
                                      ? 'text-primary-foreground opacity-60'
                                      : 'opacity-30',
                                sorted === 'asc' && 'rotate-180',
                            )}
                        />
                        {sortPriority !== undefined && (
                            <span
                                aria-hidden
                                className="h-4 min-w-4 px-1 leading-4 font-semibold inline-block rounded-full bg-primary text-center text-[10px] text-primary-foreground tabular-nums"
                            >
                                {sortPriority}
                            </span>
                        )}
                    </button>
                ) : (
                    label
                )}
                {filter}
            </div>
        </th>
    );
}
