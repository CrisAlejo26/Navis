import type { EntryKind } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';

/**
 * El tipo de una entrada, con su icono y su color (D2, D15).
 *
 * El color viaja en la variable `--acento` y no en una clase: `bg-${color}`
 * no existiría, porque Tailwind solo compila las clases escritas (misma
 * mecánica que las emociones de un sueño). El icono acompaña y **el texto
 * informa** (Regla 3 §7).
 */
export function EntryKindBadge({ kind, className }: { kind: EntryKind; className?: string }) {
  const { t } = useTranslation();
  const { Icon, accent, labelKey } = ENTRY_KIND_STYLES[kind];

  return (
    <span
      style={accentVars(accent)}
      className={cn(
        'gap-1.5 px-2 py-0.5 font-medium inline-flex items-center rounded-full border text-[11px]',
        'border-[var(--acento)]/35 bg-[var(--acento)]/10 text-[var(--acento)]',
        className,
      )}
    >
      <Icon size={11} aria-hidden />
      {t(labelKey)}
    </span>
  );
}
