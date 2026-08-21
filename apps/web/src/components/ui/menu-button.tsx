import { ChevronDown } from 'lucide-react';
import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface MenuOption {
  id: string;
  label: string;
  hint?: string;
  icon?: ReactNode;
  onSelect: () => void;
}

/**
 * Un botón que despliega dos o tres acciones de la misma familia.
 *
 * Existe para no llenar una fila de botones con variantes de lo mismo
 * —descargar en imagen, descargar en PDF—: ahí lo que hay que elegir es el
 * formato, no la acción, y así se lee de un vistazo (Regla 9).
 */
export function MenuButton({
  label,
  options,
  variant = 'ghost',
  size,
  icon,
  className,
  iconOnly = false,
}: {
  label: string;
  options: MenuOption[];
  variant?: ComponentProps<typeof Button>['variant'];
  size?: ComponentProps<typeof Button>['size'];
  icon?: ReactNode;
  className?: string;
  /** Sin texto ni flecha visibles: `label` queda como `aria-label`, para un
      disparador compacto (fila de la barra lateral, celda de una tabla). */
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
      // Un clic dentro no cierra: quien pulsa una opción ya la cierra al elegir.
      if (event.type === 'pointerdown' && box.current?.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div ref={box} className={cn('relative', className)}>
      <Button
        variant={variant}
        size={size}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
      >
        {icon}
        {!iconOnly && label}
        {!iconOnly && (
          <ChevronDown size={14} aria-hidden className={cn('transition', open && 'rotate-180')} />
        )}
      </Button>

      {open && (
        <div
          role="menu"
          className={cn(
            'p-1 left-0 mb-2 w-52 animate-page-in absolute bottom-full z-10 origin-bottom-left',
            'shadow-lg rounded-xl border bg-popover',
            // Compacto: el disparador vive pegado al borde derecho de una fila
            // estrecha (la barra lateral), y esa barra recorta lo que se sale
            // por la derecha (`overflow-x-hidden`, para el scroll vertical).
            // Abrir hacia la izquierda es lo que deja el menú entero visible.
            iconOnly && 'right-0 mt-1 mb-0 top-full bottom-auto left-auto origin-top-right',
          )}
        >
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitem"
              className={cn(
                'gap-2.5 px-2.5 py-2 flex w-full cursor-pointer items-center rounded-lg text-left',
                'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              )}
              onClick={() => {
                setOpen(false);
                option.onSelect();
              }}
            >
              {option.icon}
              <span className="min-w-0">
                <span className="text-sm leading-tight block">{option.label}</span>
                {option.hint && (
                  <span className="text-xs block text-muted-foreground">{option.hint}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
