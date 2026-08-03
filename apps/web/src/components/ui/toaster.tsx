import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { useToastStore, type ToastKind } from '@/lib/toast';

/** Icono y color por tipo. El color nunca informa solo: siempre va el icono. */
const STYLES: Record<ToastKind, { icon: LucideIcon; accent: string }> = {
  success: { icon: CircleCheck, accent: 'text-success' },
  error: { icon: CircleAlert, accent: 'text-destructive' },
  info: { icon: Info, accent: 'text-primary' },
};

/**
 * Los avisos, arriba a la derecha.
 *
 * Arriba y no abajo a propósito: abajo están la navegación de móvil y el aviso
 * de actualización de la PWA, y se taparían entre ellos.
 *
 * `aria-live="polite"` en el contenedor, que está siempre en el árbol: si se
 * montase junto con el aviso, el lector de pantalla no llegaría a anunciarlo.
 */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      aria-live="polite"
      aria-relevant="additions"
      className="top-4 inset-x-4 gap-2 sm:inset-x-auto sm:right-4 sm:w-88 pointer-events-none fixed z-50 flex flex-col"
    >
      {toasts.map(({ id, kind, message }) => {
        const { icon: Icon, accent } = STYLES[kind];

        return (
          <div
            key={id}
            role="status"
            className="gap-3 p-3.5 shadow-lg animate-rise-in pointer-events-auto flex items-start rounded-xl border bg-popover text-popover-foreground"
          >
            <Icon size={17} aria-hidden className={cn('mt-0.5 shrink-0', accent)} />
            <p className="text-sm leading-snug flex-1">{message}</p>
            <button
              type="button"
              aria-label={t('common.close')}
              onClick={() => {
                dismiss(id);
              }}
              className="h-6 w-6 -mt-0.5 -mr-1 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
