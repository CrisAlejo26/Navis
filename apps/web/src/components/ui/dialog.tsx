import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Ancho del modal. Lo que enseña una vista previa necesita más que un formulario. */
  width?: string;
  children: ReactNode;
}

/**
 * Ventana modal de Navis, sobre el `<dialog>` del navegador.
 *
 * Nativo a propósito: el foco se queda dentro, Escape cierra y el fondo se
 * inertiza sin que tengamos que reimplementar nada de eso —que es justo donde
 * se rompe la accesibilidad de los modales hechos a mano—.
 *
 * Toda acción importante o destructiva pasa por aquí: nada se ejecuta con un
 * solo clic sin confirmación.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  width = 'min(30rem, calc(100vw - 2rem))',
  children,
}: DialogProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      onClose={onClose}
      onCancel={onClose}
      style={{ width }}
      // `max-h-[90dvh]` con scroll dentro: un formulario alto —un área de texto
      // de doce filas, por ejemplo— desbordaba la ventana en un teléfono y el
      // botón de guardar quedaba fuera de alcance. `dvh` y no `vh`, que con la
      // barra del navegador móvil miente (Regla 5 §3).
      className="p-0 shadow-lg backdrop:bg-black/45 m-auto max-h-[90dvh] max-w-none overflow-y-auto rounded-xl border bg-card text-card-foreground"
    >
      {open && (
        // `min-w-0`: un hijo ancho dentro de un `flex-col` ensancha al padre
        // y sacaría el diálogo de la pantalla (CLAUDE.md).
        <div className="p-5 min-w-0 animate-page-in">
          <div className="gap-4 mb-4 flex items-start justify-between">
            <div>
              <h2 id="dialog-title" className="text-base font-semibold">
                {title}
              </h2>
              {description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="h-8 w-8 -mt-1 -mr-1 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X size={16} aria-hidden />
            </button>
          </div>

          {children}
        </div>
      )}
    </dialog>
  );
}
