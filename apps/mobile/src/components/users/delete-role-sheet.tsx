import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';
import { useRemoveRole } from '@/hooks/use-users-mutations';
import { userErrorKey, type UserErrorKey } from '@/lib/users/user-errors';

/** Baja de un rol propio. Solo se puede si no lo tiene ninguna cuenta; si no, el puerto responde y se dice. */
export function DeleteRoleSheet({
    id,
    name,
    onClose,
    onDeleted,
}: {
    id: string;
    name: string;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const { t } = useTranslation(),
        remove = useRemoveRole();
    const [failure, setFailure] = useState<UserErrorKey | null>(null);

    async function confirm(): Promise<void> {
        setFailure(null);
        try {
            await remove.mutateAsync({ id });
            onDeleted();
        } catch (error) {
            setFailure(userErrorKey(error));
        }
    }

    return (
        <BottomSheet
            visible
            showCloseButton={false}
            onClose={() => {
                if (!remove.isPending) onClose();
            }}
            title={t('roles.deleteRoleTitle', { name })}
        >
            <View className="gap-4 pb-3">
                <Icon
                    name="alert-circle-outline"
                    tone="destructive"
                    background="soft"
                    containerSize={48}
                    size="lg"
                />
                <Text className="font-sans text-base leading-6 text-muted-foreground">
                    {t('roles.deleteRoleBody')}
                </Text>
                {failure ? <FieldError message={t(failure)} /> : null}
                <Button
                    testID="role-delete-confirm"
                    title={t('roles.deleteRole')}
                    variant="destructive"
                    size="lg"
                    loading={remove.isPending}
                    onPress={() => void confirm()}
                />
                <Button
                    title={t('common.cancel')}
                    variant="ghost"
                    size="lg"
                    disabled={remove.isPending}
                    onPress={onClose}
                />
            </View>
        </BottomSheet>
    );
}
