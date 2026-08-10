import { MoreVertical } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

export interface MessageMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}

/**
 * El menú de acciones de un mensaje: responder, reenviar, eliminar…
 * Icono suelto y no `MenuButton` (que lleva etiqueta): aquí el botón vive
 * dentro de una burbuja pequeña y solo se ve al pasar el ratón o enfocarlo.
 */
export function MessageMenu({ actions }: { actions: MessageMenuAction[] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return;
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

  if (actions.length === 0) return null;

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.more')}
        onClick={() => {
          setOpen((previous) => !previous);
        }}
        className={cn(
          'h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-full text-muted-foreground',
          'opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100',
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
              onClick={() => {
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
