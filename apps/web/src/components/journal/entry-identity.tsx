import type { JournalEntry } from '@navis/shared';
import { FileText, Image, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { EntryKindBadge } from '@/components/journal/entry-kind-badge';
import { JournalEntryCard } from '@/components/journal/journal-entry-card';
import { Button } from '@/components/ui/button';
import { MenuButton } from '@/components/ui/menu-button';
import { accentVars } from '@/lib/accents';
import { useChurches } from '@/lib/churches';
import { formatDay } from '@/lib/format';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { useEntryImageExport } from '@/lib/journal/use-entry-image';
import { useEntryMarkdownDownload } from '@/lib/journal/use-entry-markdown';
import { slugify } from '@/lib/share/files';

/**
 * La cabecera de la ficha, **teñida con el color del tipo** (§7.7 revisado).
 *
 * A lo ancho y no en una columna angosta: mismo patrón que la ficha de un
 * sueño y la de una profecía —meta arriba, título debajo, acciones en su
 * fila—, esta vez con el color que ya trae `ENTRY_KIND_STYLES`. El dato sigue
 * poniendo el color, no la pantalla (§7.1.1 de RFC 0005, reutilizado aquí).
 */
export function EntryIdentity({
  entry,
  onEdit,
  onDelete,
}: {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const { accent } = ENTRY_KIND_STYLES[entry.kind];
  const { active: church } = useChurches();

  const poster = useRef<HTMLDivElement>(null);
  const image = useEntryImageExport(poster);
  const downloadMarkdown = useEntryMarkdownDownload();

  return (
    <header
      style={accentVars(accent)}
      className="gap-4 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border bg-gradient-to-br from-[var(--acento)]/22 to-[var(--acento)]/8"
    >
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted-foreground uppercase tabular-nums">
          {formatDay(entry.occurredAt)}
          {entry.authorName && ` · ${t('journal.authorLabel', { name: entry.authorName })}`}
        </p>
        <h1 className="mt-1 text-2xl font-semibold leading-snug tracking-[-0.02em]">
          {entry.title}
        </h1>
      </div>

      <EntryKindBadge kind={entry.kind} className="self-start" />

      <div className="gap-2 flex flex-wrap">
        <Button size="lg" onClick={onEdit}>
          <Pencil size={18} aria-hidden />
          {t('journal.edit')}
        </Button>

        <MenuButton
          label={t('common.actions')}
          variant="secondary"
          size="lg"
          icon={<MoreVertical size={16} aria-hidden />}
          options={[
            {
              id: 'markdown',
              label: t('export.markdown'),
              icon: <FileText size={15} aria-hidden />,
              onSelect: () => {
                downloadMarkdown(entry);
              },
            },
            {
              id: 'image',
              label: t('journal.export.shareImage'),
              icon: <Image size={15} aria-hidden />,
              onSelect: () => {
                void image.share(`${slugify(entry.title) || 'entrada'}.png`, entry.title);
              },
            },
            {
              id: 'delete',
              label: t('common.delete'),
              icon: <Trash2 size={15} aria-hidden />,
              onSelect: onDelete,
            },
          ]}
        />
      </div>

      {/* La lámina que se rasteriza, fuera de la pantalla: no es una vista
          previa, es autocontenida a propósito (`rasterize.ts`). */}
      <div aria-hidden className="top-0 pointer-events-none absolute -left-[9999px]">
        <JournalEntryCard
          ref={poster}
          entry={entry}
          churchName={church?.name ?? ''}
          continuesLabel={t('journal.export.continuesInNavis')}
          reminderLabel={t('journal.reminderPending')}
        />
      </div>
    </header>
  );
}
