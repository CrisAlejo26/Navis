import { buildZipBytes, utf8 } from '@navis/shared';
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';
import {
    findJournalEntry,
    journalDb,
    type JournalContext,
    type LocalJournalEntry,
} from '@/data/repos/journal-repo';
import { i18n } from '@/lib/i18n';

export function entryMarkdown(entry: LocalJournalEntry): string {
    const t = (key: string) => i18n.t(`journal.export.${key}`);
    const lines = [
        '---',
        `${t('frontmatterTitle')}: ${JSON.stringify(entry.title)}`,
        `${t('frontmatterKind')}: ${JSON.stringify(i18n.t(`journal.kind.${entry.kind}`))}`,
        `${t('frontmatterDate')}: ${entry.occurredAt}`,
    ];
    if (entry.remindAt)
        lines.push(
            `${t('frontmatterReminder')}: ${JSON.stringify(`${entry.remindAt}${entry.remindText ? ` — ${entry.remindText}` : ''}`)}`,
        );
    lines.push(
        '---',
        '',
        `# ${entry.title}`,
        '',
        `## ${t('annotationHeading')}`,
        '',
        entry.annotation,
    );
    if (entry.learned) lines.push('', `## ${t('learnedHeading')}`, '', entry.learned);
    return lines.join('\n') + '\n';
}
export async function shareJournalEntries(
    context: JournalContext,
    ids: readonly string[],
    zip = ids.length > 1,
) {
    await journalDb(context, true);
    if (!ids.length || !(await isAvailableAsync())) throw new Error('sharing-unavailable');
    const entries: LocalJournalEntry[] = [];
    for (const id of new Set(ids)) {
        const entry = await findJournalEntry(context, id);
        if (!entry) throw new Error('not-found');
        entries.push(entry);
    }
    const file = new File(Paths.cache, `navis-cuaderno-${Date.now()}.${zip ? 'zip' : 'md'}`);
    try {
        file.create();
        file.write(
            zip
                ? buildZipBytes(
                      entries.map((entry, index) => ({
                          name: `${index + 1}-${entry.title
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')
                              .replace(/[^a-zA-Z0-9-]/g, '-')
                              .slice(0, 80)}.md`,
                          data: utf8(entryMarkdown(entry)),
                      })),
                  )
                : entryMarkdown(entries[0]),
        );
        await shareAsync(file.uri, {
            mimeType: zip ? 'application/zip' : 'text/markdown',
            dialogTitle: i18n.t('journal.bulkExport'),
        });
    } finally {
        if (file.exists) file.delete();
    }
}
