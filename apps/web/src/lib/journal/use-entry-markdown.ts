import type { JournalEntry } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { toEntryMarkdownBlob } from '@/lib/export/journal-markdown';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { downloadFile, slugify } from '@/lib/share/files';

/** Descargar una entrada, sola, en Markdown (D12): un `.md` suelto. */
export function useEntryMarkdownDownload() {
  const { t } = useTranslation();

  return (entry: JournalEntry): void => {
    const kindLabel = t(ENTRY_KIND_STYLES[entry.kind].labelKey);

    const blob = toEntryMarkdownBlob(
      {
        id: entry.id,
        title: entry.title,
        kind: entry.kind,
        occurredAt: entry.occurredAt,
        hasLearned: Boolean(entry.learned),
        hasAudio: entry.audios.length > 0,
        remindAt: entry.remindAt,
        remindDoneAt: entry.remindDoneAt,
        authorName: entry.authorName,
        annotation: entry.annotation,
        learned: entry.learned,
        remindText: entry.remindText,
        createdAt: entry.createdAt,
      },
      kindLabel,
      {
        frontmatterTitle: t('journal.export.frontmatterTitle'),
        frontmatterKind: t('journal.export.frontmatterKind'),
        frontmatterDate: t('journal.export.frontmatterDate'),
        frontmatterReminder: t('journal.export.frontmatterReminder'),
        annotationHeading: t('journal.export.annotationHeading'),
        learnedHeading: t('journal.export.learnedHeading'),
      },
    );

    downloadFile(blob, `${slugify(entry.title) || 'entrada'}.md`);
  };
}
