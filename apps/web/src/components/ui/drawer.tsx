import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Por qué borde entra. La navegación llega por la izquierda; el detalle de
   *  algo que se está mirando, por la derecha, que es de donde se «tira». */
  side?: 'left' | 'right';
  /** Ancho del panel. El de detalle necesita más que el de navegación. */
  width?: string;
  children: ReactNode;
}

/**
 * Panel lateral que entra desde la izquierda, sobre el `<dialog>` del
 * navegador —igual que `Dialog`, y por lo mismo: el foco se queda dentro,
 * Escape cierra y el fondo se inertiza sin reimplementar nada de eso—.
 *
 * `m-0 mr-auto` lo pega al borde izquierdo: por defecto el `<dialog>` se
 * centra con `margin: auto`.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = 'left',
  width = 'min(18rem, 84vw)',
  children,
}: DrawerProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const drawer = ref.current;
    if (!drawer) return;

    if (open && !drawer.open) drawer.showModal();
    if (!open && drawer.open) drawer.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={onClose}
      style={{ width }}
      className={cn(
        'm-0 p-0 backdrop:bg-black/45 h-dvh max-h-none bg-card text-card-foreground',
        side === 'left' ? 'mr-auto border-r' : 'ml-auto border-l',
      )}
    >
      {open && (
        <div
          className={cn(
            'flex h-full flex-col',
            side === 'left' ? 'animate-slide-in' : 'animate-slide-in-right',
          )}
        >
          <div className="h-14 px-4 flex shrink-0 items-center justify-between border-b">
            <p className="text-sm font-semibold">{title}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="h-9 w-9 -mr-2 inline-flex cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex flex-1 flex-col overflow-y-auto">{children}</div>
        </div>
      )}
    </dialog>
  );
}
