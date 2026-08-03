import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
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
export function Drawer({ open, onClose, title, children }: DrawerProps) {
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
      className="m-0 p-0 backdrop:bg-black/45 mr-auto h-dvh max-h-none w-[min(18rem,84vw)] border-r bg-card text-card-foreground"
    >
      {open && (
        <div className="animate-slide-in flex h-full flex-col">
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
