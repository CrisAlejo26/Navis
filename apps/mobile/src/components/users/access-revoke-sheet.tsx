import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';
import type { useViewerDetail } from '@/hooks/use-viewer-detail';

/** Revocar es definitivo y echa fuera al momento a quien esté dentro: se pide confirmar. */
export function AccessRevokeSheet({
    state,
    onClose,
}: {
    state: ReturnType<typeof useViewerDetail>;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible showCloseButton={false} title={t('lists.revoke')} onClose={onClose}>
            <View className="gap-4 pb-3">
                <Icon
                    name="alert-circle-outline"
                    tone="destructive"
                    background="soft"
                    containerSize={48}
                    size="lg"
                />
                <Text className="font-sans text-base leading-6 text-muted-foreground">
                    {t('lists.localRevokeExplain')}
                </Text>
                {state.failed ? <FieldError message={t('lists.viewerSaveFailed')} /> : null}
                <Button
                    testID="access-revoke-confirm"
                    title={t('lists.revoke')}
                    variant="destructive"
                    size="lg"
                    loading={state.removing}
                    onPress={state.revoke}
                />
                <Button
                    title={t('common.cancel')}
                    variant="ghost"
                    size="lg"
                    disabled={state.busy}
                    onPress={onClose}
                />
            </View>
        </BottomSheet>
    );
}
