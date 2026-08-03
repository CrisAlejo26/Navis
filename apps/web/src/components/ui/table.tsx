import { ChevronDown } from 'lucide-react';
import type { HTMLAttributes, ReactNode, ThHTMLAttributes } from 'react';

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
  /** Sin él, la cabecera es una etiqueta y no un botón. */
  onSort?: () => void;
  /** Texto accesible del botón de ordenar, ya traducido. */
  sortLabel?: string;
}

export function TableHeader({
  sorted = false,
  onSort,
  sortLabel,
  className,
  children,
  ...props
}: HeaderProps) {
  const label = (
    <span className="font-semibold text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </span>
  );

  return (
    <th
      scope="col"
      aria-sort={sorted ? (sorted === 'asc' ? 'ascending' : 'descending') : undefined}
      className={cn('px-4 py-3 font-medium text-left whitespace-nowrap', className)}
      {...props}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          aria-label={sortLabel}
          className="gap-1.5 inline-flex cursor-pointer items-center rounded-sm hover:text-foreground"
        >
          {label}
          <ChevronDown
            size={13}
            aria-hidden
            className={cn(
              'transition-[transform,opacity] duration-200',
              sorted ? 'text-foreground opacity-100' : 'opacity-30',
              sorted === 'asc' && 'rotate-180',
            )}
          />
        </button>
      ) : (
        label
      )}
    </th>
  );
}
