import { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { passwordSchema, type ManagedUser } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';
import { PasswordField } from '@/components/ui/password-field';
import { useSetUserPassword } from '@/hooks/use-users-mutations';
import { userErrorKey, type UserErrorKey } from '@/lib/users/user-errors';

/** La contraseña nueva de otra cuenta. Al acabar, la propia hoja lo confirma en vez de cerrarse sin decir nada. */
export function PasswordSheet({ user, onClose }: { user: ManagedUser; onClose: () => void }) {
    const { t } = useTranslation(),
        save = useSetUserPassword();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<UserErrorKey | 'auth.passwordHint' | null>(null);
    const [done, setDone] = useState(false);

    async function submit(): Promise<void> {
        if (!passwordSchema.safeParse(password).success) return setError('auth.passwordHint');
        try {
            await save.mutateAsync({ id: user.id, password });
            setDone(true);
        } catch (failure) {
            setError(userErrorKey(failure));
        }
    }

    return (
        <BottomSheet
            visible
            onClose={onClose}
            title={t('roles.changePassword')}
            footer={
                <Button
                    testID="password-save"
                    title={done ? t('common.close') : t('common.save')}
                    size="lg"
                    loading={save.isPending}
                    onPress={() => (done ? onClose() : void submit())}
                />
            }
        >
            {done ? (
                <View className="gap-3 py-6 items-center">
                    <Icon name="checkmark-circle" tone="success" background="soft" size="lg" />
                    <Text className="font-sans-semibold text-base text-foreground">
                        {t('roles.passwordUpdated')}
                    </Text>
                </View>
            ) : (
                <View className="gap-3 pb-2">
                    <Text className="text-sm text-muted-foreground">{user.name}</Text>
                    <PasswordField
                        testID="password-input"
                        label={t('roles.newPassword')}
                        value={password}
                        onChangeText={(value) => {
                            setPassword(value);
                            setError(null);
                        }}
                        autoComplete="new-password"
                    />
                    <Text className="text-sm text-muted-foreground">{t('auth.passwordHint')}</Text>
                    {error ? <FieldError message={t(error)} /> : null}
                </View>
            )}
        </BottomSheet>
    );
}
