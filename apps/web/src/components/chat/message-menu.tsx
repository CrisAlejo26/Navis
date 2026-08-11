import { MoreVertical } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useDismissablePopover } from '@/lib/use-dismissable-popover';
import { cn } from '@/lib/cn';

export interface MessageMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

/**
 * El menú de acciones de un mensaje o de una fila: responder, reenviar,
 * silenciar…
 *
 * `opacity-0 group-hover:opacity-100` es lo que lo revela sin ratón de por
 * medio — en un teléfono no hay hover, así que por debajo de `md` se ve
 * siempre. Antes solo se revelaba al pasar el ratón o enfocarlo, y por eso
 * no había forma de abrirlo en el móvil (RFC 0019).
 */
export function MessageMenu({
  actions,
  className,
}: {
  actions: MessageMenuAction[];
  className?: string;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const box = useDismissablePopover<HTMLDivElement>(open, () => setOpen(false));

  if (actions.length === 0) return null;

  return (
    <div ref={box} className={cn('relative', className)}>
      {/* `preventDefault` es lo que evita que este botón, dentro de la fila
          de una conversación (`NavLink`, RFC 0019), dispare también la
          navegación — `stopPropagation` solo no basta: al no dejar llegar el
          clic al propio `onClick` de `NavLink`, es react-router quien deja
          de llamar a `preventDefault()`, y el navegador sigue el `href` de
          todas formas. Van en los dos elementos ya interactivos (el botón y
          cada opción), no en un `div` envolvente — eso disparaba los avisos
          de accesibilidad de un elemento no nativo con manejador de clic. */}
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.more')}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((previous) => !previous);
        }}
        className={cn(
          'h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-full text-muted-foreground',
          'md:opacity-0 md:group-hover:opacity-100 opacity-100 transition-opacity duration-150 focus-visible:opacity-100',
          'hover:bg-muted hover:text-foreground focus-visible:outline-none',
          open && 'bg-muted opacity-100',
        )}
      >
        <MoreVertical size={15} aria-hidden />
      </button>

      {open && (
        <div
          role="menu"
          className="p-1 right-0 mt-1 w-48 animate-page-in shadow-lg absolute z-10 rounded-xl border bg-popover"
        >
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              role="menuitem"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                action.onSelect();
              }}
              className={cn(
                'gap-2.5 px-2.5 py-2 text-sm flex w-full cursor-pointer items-center rounded-lg text-left',
                'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                action.destructive && 'text-destructive',
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
