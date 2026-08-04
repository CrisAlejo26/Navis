import type { NoteCounts, NoteKind } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { NOTE_ORDER, NOTE_STYLES } from '@/lib/believers/note-kinds';

/**
 * Las pastillas de tipo de la bitácora, con su cuenta: «Todo (37) · Seguimiento
 * (21) · Testimonio (6)…» (§7.5).
 *
 * Un tipo del que no hay ninguna nota no se propone: filtrar por él daría una
 * lista vacía y ocupa sitio en un ancho de teléfono.
 */
export function NoteKindPills({
  counts,
  value,
  onChange,
}: {
  counts: NoteCounts | undefined;
  value: NoteKind | undefined;
  onChange: (kind: NoteKind | undefined) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-1.5 flex flex-wrap items-center">
      <Chip
        active={value === undefined}
        onClick={() => {
          onChange(undefined);
        }}
      >
        {t('notes.all')}
        {counts && <span className="text-[11px] tabular-nums opacity-70">{counts.total}</span>}
      </Chip>

      {NOTE_ORDER.filter((kind) => (counts?.[kind] ?? 0) > 0 || kind === value).map((kind) => {
        const { Icon, labelKey } = NOTE_STYLES[kind];

        return (
          <Chip
            key={kind}
            active={value === kind}
            onClick={() => {
              onChange(value === kind ? undefined : kind);
            }}
          >
            <Icon size={13} aria-hidden />
            {t(labelKey)}
            {counts && <span className="text-[11px] tabular-nums opacity-70">{counts[kind]}</span>}
          </Chip>
        );
      })}
    </div>
  );
}
