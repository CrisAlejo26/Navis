import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { UserDialog } from './use-user-detail';

/** Editar, cambiar la contraseña y dar de baja: la acción principal arriba y la destructiva, aparte y en rojo. */
export function UserDetailActions({ onOpen }: { onOpen: (dialog: UserDialog) => void }) {
    const { t } = useTranslation();
    return (
        <View className="gap-3">
            <Button
                testID="user-edit"
                title={t('roles.editUser')}
                size="lg"
                onPress={() => onOpen('edit')}
            />
            <Button
                testID="user-password"
                title={t('roles.changePassword')}
                variant="outline"
                size="lg"
                onPress={() => onOpen('password')}
            />
            <Button
                testID="user-delete"
                title={t('roles.deleteUser')}
                variant="destructive"
                size="lg"
                onPress={() => onOpen('delete')}
            />
        </View>
    );
}
