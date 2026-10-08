import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';
import { useDeleteUser } from './use-delete-user';

export function DeleteUserSheet({
    user,
    onClose,
    onDeleted,
}: {
    user: ManagedUser;
    onClose: () => void;
    onDeleted: () => void;
}) {
    const { t } = useTranslation(),
        d = useDeleteUser(user, onDeleted),
        churches = d.impacts;
    return (
        <BottomSheet
            visible
            showCloseButton={false}
            onClose={() => {
                if (!d.busy) onClose();
            }}
            title={
                churches
                    ? t('roles.ownsChurchesTitle', { count: churches.length })
                    : t('roles.deleteTitle', { name: user.name })
            }
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
                    {churches ? t('roles.ownsChurchesBody') : t('roles.deleteBody')}
                </Text>
                {churches?.map((church) => (
                    <View key={church.id} className="gap-1 rounded-2xl p-3 bg-muted">
                        <Text className="font-sans-semibold text-base text-foreground">
                            {church.name}
                        </Text>
                        <Text className="text-sm text-muted-foreground">
                            {t('roles.churchImpact', {
                                believers: church.believers,
                                lists: church.lists,
                                calendars: church.calendars,
                            })}
                        </Text>
                    </View>
                ))}
                {churches ? (
                    <Text className="text-sm text-muted-foreground">
                        {t('roles.transferUnavailable')}
                    </Text>
                ) : null}
                {d.failure ? <FieldError message={t(d.failure)} /> : null}
                <Button
                    testID="delete-user-confirm"
                    title={churches ? t('roles.deleteWithChurches') : t('roles.deleteUser')}
                    variant="destructive"
                    size="lg"
                    loading={d.busy}
                    onPress={() => void d.confirm()}
                />
                <Button
                    title={t('common.cancel')}
                    variant="ghost"
                    size="lg"
                    disabled={d.busy}
                    onPress={onClose}
                />
            </View>
        </BottomSheet>
    );
}
