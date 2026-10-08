import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { ListViewer } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ViewerCredentials } from '@/components/lists/viewer-credentials';

/** La contraseña nueva, que solo se ve ahora; quien estuviera dentro ya ha salido. */
export function AccessCredentialsSheet({
    viewer,
    password,
    onClose,
}: {
    viewer: ListViewer;
    password: string;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible title={t('roles.newPassword')} onClose={onClose}>
            <View className="gap-4 pb-3">
                <ViewerCredentials username={viewer.username} password={password} />
                <Text className="text-sm text-muted-foreground">{t('lists.revokeExplain')}</Text>
                <Button
                    testID="access-credentials-done"
                    title={t('common.close')}
                    size="lg"
                    onPress={onClose}
                />
            </View>
        </BottomSheet>
    );
}
