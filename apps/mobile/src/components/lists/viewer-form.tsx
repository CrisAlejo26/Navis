import { createListViewerSchema } from '@navis/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { useLists, useListMutation } from '@/hooks/use-lists';
import { createListViewer } from '@/data/repos/list-viewers-writes';
import { newViewerPassword } from '@/lib/lists/viewer-password';
import { ViewerFormFields, type ViewerDraft } from './viewer-form-fields';
import { ViewerGrants } from './viewer-grants';
import { ViewerCredentials } from './viewer-credentials';

/** `listId` es la lista desde la que se crea; sin ella (el directorio de accesos), nace sin listas y se eligen después. */
export function ViewerForm({ listId, onClose }: { listId?: string; onClose: () => void }) {
    const { t } = useTranslation();
    const lists = useLists();
    const [draft, setDraft] = useState<ViewerDraft>(() => ({
        kind: 'believer',
        believerId: null,
        label: '',
        username: '',
        password: newViewerPassword(),
    }));
    const [ids, setIds] = useState<string[]>(listId ? [listId] : []);
    const [created, setCreated] = useState(false);
    const [error, setError] = useState(false);
    const lock = useRef(false);
    const save = useListMutation(createListViewer);
    async function submit() {
        if (lock.current) return;
        const parsed = createListViewerSchema.safeParse({ ...draft, listIds: ids });
        if (!parsed.success || (draft.kind === 'believer' && !draft.believerId))
            return setError(true);
        lock.current = true;
        setError(false);
        try {
            await save.mutateAsync(parsed.data);
            setCreated(true);
        } catch {
            setError(true);
        } finally {
            lock.current = false;
        }
    }
    return (
        <BottomSheet
            visible
            title={t('lists.newViewer')}
            onClose={() => {
                if (!lock.current) onClose();
            }}
        >
            <View className="gap-4 pb-3">
                {created ? (
                    <>
                        <ViewerCredentials
                            username={draft.username.trim().toLowerCase()}
                            password={draft.password}
                        />
                        <Button testID="viewer-done" title={t('common.close')} onPress={onClose} />
                    </>
                ) : (
                    <>
                        <ViewerFormFields
                            draft={draft}
                            onChange={setDraft}
                            disabled={save.isPending}
                        />
                        <ViewerGrants
                            lists={lists.data ?? []}
                            selected={ids}
                            onChange={setIds}
                            disabled={save.isPending || lists.isPending}
                        />
                        {error ? <FieldError message={t('lists.viewerSaveFailed')} /> : null}
                        <Button
                            testID="viewer-create"
                            title={t('lists.newViewer')}
                            loading={save.isPending}
                            disabled={lists.isPending || lists.isError}
                            onPress={() => void submit()}
                        />
                    </>
                )}
            </View>
        </BottomSheet>
    );
}
