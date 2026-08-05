import type { ListVisibility } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { VISIBILITY_ICON, VISIBILITY_LABEL_KEY } from '@/lib/lists/visibility';

/**
 * La pastilla de estado de una lista, **con icono y texto** (RFC 0010 §8.2).
 *
 * Los tres modos se distinguen de un vistazo desde la portada, que es donde
 * hace falta: nunca solo por color (Regla 3 §7).
 *
 * `onPanel` es para cuando va dentro del panel relleno del tablón: ahí el
 * contraste lo da el `-foreground` de la propia lista, no los tokens neutros.
 */
export function VisibilityBadge({
  visibility,
  onPanel = false,
}: {
  visibility: ListVisibility;
  onPanel?: boolean;
}) {
  const { t } = useTranslation();
  const Icon = VISIBILITY_ICON[visibility];

  return (
    <span
      className={cn(
        'h-6 gap-1.5 px-2.5 font-medium inline-flex items-center rounded-full text-[11px]',
        // Sobre el panel relleno, el contraste lo da el `-foreground` del propio
        // acento (`--acento-fg`), que no cambia con el tema porque el color de
        // la lista tampoco (Regla 3 §6).
        onPanel
          ? 'bg-[var(--acento-fg)]/18 text-[var(--acento-fg)]'
          : 'bg-muted text-muted-foreground',
      )}
    >
      <Icon size={12} aria-hidden />
      {t(VISIBILITY_LABEL_KEY[visibility])}
    </span>
  );
}
