import { ENTRY_KINDS, type JournalEntryListItem } from '@navis/shared';
import { AudioLines } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { EntryActions } from '@/components/journal/entry-actions';
import { EntryKindBadge } from '@/components/journal/entry-kind-badge';
import { ReminderIndicator } from '@/components/journal/reminder-indicator';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { formatDay } from '@/lib/format';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';

interface Handlers {
    onEdit: (entry: JournalEntryListItem) => void;
    onDelete: (entry: JournalEntryListItem) => void;
}

/**
 * Las columnas de la tabla del cuaderno, con lo mismo que pintaba la fila de antes.
 *
 * La API filtra por tipo, por un tramo de fechas y por «recordatorio pendiente», y
 * ordena por **una** de fecha, título o tipo; así se declara. `onEdit` y `onDelete`
 * tienen que ser estables (un `setState`).
 */
export function useEntryColumns({
    onEdit,
    onDelete,
}: Handlers): DataTableColumn<JournalEntryListItem>[] {
    const { t } = useTranslation();

    return useMemo(
        () =>
            [
                {
                    id: 'title',
                    kind: 'text',
                    label: t('journal.columns.title'),
                    hideable: false,
                    value: (entry) => entry.title,
                    cell: (entry) => (
                        <>
                            <Link
                                to={`/journal/${entry.id}`}
                                className="max-w-xs font-medium block truncate text-[15px] hover:underline"
                            >
                                {entry.title}
                            </Link>
                            <span className="gap-2 text-xs max-w-xs flex items-center text-muted-foreground">
                                <span className="truncate">{entry.excerpt}</span>
                                {entry.hasAudio && (
                                    <AudioLines
                                        size={12}
                                        aria-label={t('journal.audiosField')}
                                        className="shrink-0"
                                    />
                                )}
                            </span>
                        </>
                    ),
                },
                {
                    id: 'kind',
                    kind: 'select',
                    label: t('journal.columns.kind'),
                    filterable: true,
                    facet: true,
                    operators: ['in'],
                    description: t('journal.filterKindHelp'),
                    options: ENTRY_KINDS.map((kind) => ({
                        value: kind,
                        label: t(ENTRY_KIND_STYLES[kind].labelKey),
                        accent: ENTRY_KIND_STYLES[kind].accent,
                    })),
                    value: (entry) => entry.kind,
                    cell: (entry) => <EntryKindBadge kind={entry.kind} />,
                },
                {
                    id: 'date',
                    kind: 'date',
                    label: t('journal.columns.date'),
                    className: 'text-sm tabular-nums',
                    filterable: true,
                    operators: ['between'],
                    description: t('journal.filterDateHelp'),
                    value: (entry) => entry.occurredAt,
                    cell: (entry) => formatDay(entry.occurredAt),
                },
                {
                    id: 'reminder',
                    kind: 'boolean',
                    label: t('journal.columns.reminder'),
                    sortable: false,
                    filterable: true,
                    operators: ['is'],
                    description: t('journal.filterReminderHelp'),
                    className: 'text-sm',
                    value: (entry) => entry.remindAt !== null && entry.remindDoneAt === null,
                    cell: (entry, index) => (
                        <ReminderIndicator
                            remindAt={entry.remindAt}
                            remindDoneAt={entry.remindDoneAt}
                            index={index}
                        />
                    ),
                },
                {
                    id: 'author',
                    kind: 'text',
                    label: t('journal.columns.author'),
                    showFrom: 'lg',
                    sortable: false,
                    className: 'text-sm text-muted-foreground',
                    value: (entry) => entry.authorName ?? t('journal.unknownAuthor'),
                    cell: (entry) => entry.authorName ?? t('journal.unknownAuthor'),
                },
                {
                    id: 'actions',
                    kind: 'text',
                    label: t('common.actions'),
                    header: <span className="sr-only">{t('common.actions')}</span>,
                    sortable: false,
                    hideable: false,
                    align: 'right',
                    cell: (entry) => (
                        <EntryActions
                            title={entry.title}
                            onEdit={() => {
                                onEdit(entry);
                            }}
                            onDelete={() => {
                                onDelete(entry);
                            }}
                        />
                    ),
                },
            ] satisfies DataTableColumn<JournalEntryListItem>[],
        [t, onEdit, onDelete],
    );
}
