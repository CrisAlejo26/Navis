import type { List } from '@navis/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewShotRef } from 'react-native-view-shot';
import { listExportTable } from '@/lib/lists/export-table';
import { shareListFile, type ListFileFormat } from '@/lib/lists/share-file';
import { listsKey, useListContext, useListMembers, useListMutation } from './use-lists';
import { listDb } from '@/data/repos/lists-context';
import { saveListExportFields } from '@/data/repos/list-export-settings';
import { readListAssets } from '@/data/repos/list-assets';
import { useQuery } from '@tanstack/react-query';

export function useListExport(list: List, canShare: boolean) {
    const { t } = useTranslation();
    const { context } = useListContext();
    const members = useListMembers(list.id);
    const assets = useQuery({
        queryKey: [...listsKey(context), list.id, 'assets'],
        queryFn: () => readListAssets(context, list.id),
        enabled: canShare,
    });
    const [fields, setFields] = useState(list.publicFields);
    const [format, setFormat] = useState<ListFileFormat>('xlsx');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const lock = useRef(false);
    const save = useListMutation((scope, value: typeof fields) =>
        saveListExportFields(scope, list.id, value),
    );
    const poster = useRef<ViewShotRef | null>(null);
    const table = listExportTable(list.name, members.data ?? [], fields, {
        order: t('lists.order'),
        name: t('believers.columnName'),
        congregation: t('calendar.congregation'),
        ministry: t('believers.ministries'),
        note: t('lists.note'),
        arrival: t('lists.arrival'),
        bibleReadings: t('lists.bibleReadings'),
        vivenciasReadings: t('lists.vivenciasReadings'),
        bibleInstituteTimes: t('lists.bibleInstituteTimes'),
    });
    const imageTooLong = table.rows.length > 100;
    table.cover = assets.data?.cover;
    table.photos = fields.photo
        ? members.data?.map((one) => assets.data?.photos[one.believerId] ?? null)
        : undefined;
    async function send() {
        if (lock.current || !canShare) return;
        lock.current = true;
        setBusy(true);
        setError(false);
        try {
            await listDb(context, true, list.id);
            await save.mutateAsync(fields);
            const freshAssets = await readListAssets(context, list.id);
            const outgoing = {
                ...table,
                cover: freshAssets.cover,
                photos: fields.photo
                    ? members.data?.map((one) => freshAssets.photos[one.believerId] ?? null)
                    : undefined,
            };
            await shareListFile(outgoing, list.slug, format, async () => {
                const uri = await poster.current?.capture();
                if (!uri) throw new Error('capture-failed');
                return uri;
            });
        } catch {
            setError(true);
        } finally {
            lock.current = false;
            setBusy(false);
        }
    }
    return {
        fields,
        setFields,
        format,
        setFormat,
        busy,
        error,
        members,
        assets,
        poster,
        table,
        imageTooLong,
        send,
    };
}
