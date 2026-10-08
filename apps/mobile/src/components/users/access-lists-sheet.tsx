import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { ListViewer } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { ViewerGrants } from '@/components/lists/viewer-grants';
import type { useViewerDetail } from '@/hooks/use-viewer-detail';

/** A qué listas llega el acceso: cada casilla escribe al momento, igual que en la ficha de la lista. */
export function AccessListsSheet({
    viewer,
    state,
    onClose,
}: {
    viewer: ListViewer;
    state: ReturnType<typeof useViewerDetail>;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible title={t('roles.accessChangeLists')} onClose={onClose}>
            <View className="gap-4 pb-3">
                <ViewerGrants
                    lists={state.lists.data ?? []}
                    selected={viewer.listIds}
                    disabled={state.busy || state.lists.isPending}
                    onChange={state.grant}
                />
                {state.failed ? <FieldError message={t('lists.viewerSaveFailed')} /> : null}
                <Button
                    testID="access-lists-done"
                    title={t('common.close')}
                    size="lg"
                    onPress={onClose}
                />
            </View>
        </BottomSheet>
    );
}
