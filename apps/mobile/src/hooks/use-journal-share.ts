import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { captureRef, type ViewShotRef } from 'react-native-view-shot';
import { shareAsync, isAvailableAsync } from 'expo-sharing';
import { File } from 'expo-file-system';
import { useListContext } from './use-lists';
import { shareJournalEntries } from '@/lib/journal/export';

export function useJournalShare(id: string, title?: string) {
    const { t } = useTranslation(),
        scope = useListContext(),
        shot = useRef<ViewShotRef>(null);
    const [sharing, setSharing] = useState(false),
        [error, setError] = useState<string | null>(null);
    async function share(image = false) {
        if (sharing) return;
        setSharing(true);
        setError(null);
        try {
            if (!image) await shareJournalEntries(scope.context, [id], false);
            else {
                if (!(await isAvailableAsync())) throw new Error('sharing-unavailable');
                const uri = await captureRef(shot, { format: 'png', quality: 1 });
                try {
                    await shareAsync(uri, { mimeType: 'image/png', dialogTitle: title });
                } finally {
                    const file = new File(uri);
                    if (file.exists) file.delete();
                }
            }
        } catch {
            setError(t('export.failed'));
        } finally {
            setSharing(false);
        }
    }
    return { shot, sharing, share, shareError: error };
}
