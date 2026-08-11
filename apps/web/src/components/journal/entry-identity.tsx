import { useUpdateEntry } from '@navis/api-client';
import type { JournalEntry } from '@navis/shared';
import { FileText, Image, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { EntryKindBadge } from '@/components/journal/entry-kind-badge';
import { JournalEntryCard } from '@/components/journal/journal-entry-card';
import { ReminderCard } from '@/components/journal/reminder-card';
import { Button } from '@/components/ui/button';
import { MenuButton } from '@/components/ui/menu-button';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { useChurches } from '@/lib/churches';
import { formatDay } from '@/lib/format';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { useEntryImageExport } from '@/lib/journal/use-entry-image';
import { useEntryMarkdownDownload } from '@/lib/journal/use-entry-markdown';
import { slugify } from '@/lib/share/files';
import { toast } from '@/lib/toast';

/**
 * La columna izquierda de la ficha, pegajosa (§7.7): filete del color del
 * tipo, título, pastilla, fecha, autor, el recordatorio si lo hay y las
 * acciones. «Editar» es la principal; «Exportar» (Markdown/Imagen, D12/D13)
 * y «Eliminar» van en el menú.
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
  const update = useUpdateEntry(api);
  const { accent } = ENTRY_KIND_STYLES[entry.kind];
  const { active: church } = useChurches();

  const poster = useRef<HTMLDivElement>(null);
  const image = useEntryImageExport(poster);
  const downloadMarkdown = useEntryMarkdownDownload();

  const markDone = () => {
    update.mutate(
      { id: entry.id, remindDone: true },
      {
        onSuccess: () => {
          toast.success(t('journal.reminderMarkedDone'));
        },
      },
    );
  };

  return (
    <div className="lg:sticky lg:top-4 gap-4 flex flex-col">
      <header
        style={accentVars(accent)}
        className="gap-3 p-5 animate-rise-in flex flex-col rounded-xl border border-t-4 border-t-[var(--acento)] bg-card"
      >
        <h1 className="text-2xl font-semibold leading-snug tracking-[-0.02em]">{entry.title}</h1>

        <EntryKindBadge kind={entry.kind} className="self-start" />

        <p className="text-sm text-muted-foreground tabular-nums">
          {formatDay(entry.occurredAt)}
          {entry.authorName && ` · ${t('journal.authorLabel', { name: entry.authorName })}`}
        </p>

        <div className="gap-2 flex items-center">
          <Button size="md" className="flex-1" onClick={onEdit}>
            <Pencil size={15} aria-hidden />
            {t('journal.edit')}
          </Button>

          <MenuButton
            label={t('common.actions')}
            variant="secondary"
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
      </header>

      {entry.remindAt && (
        <ReminderCard
          remindAt={entry.remindAt}
          remindText={entry.remindText}
          remindDoneAt={entry.remindDoneAt}
          isMarking={update.isPending}
          onMarkDone={markDone}
        />
      )}

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
    </div>
  );
}
