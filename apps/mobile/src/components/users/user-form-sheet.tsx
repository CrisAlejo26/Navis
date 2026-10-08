import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ManagedUser } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { PasswordField } from '@/components/ui/password-field';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { useUserForm } from './use-user-form';

/** Alta (sin `user`) y edición de una cuenta, en la hoja inferior que ya usa el resto de formularios. */
export function UserFormSheet({ user, onClose }: { user?: ManagedUser; onClose: () => void }) {
    const { t } = useTranslation(),
        f = useUserForm(user, onClose),
        hint = f.values.role ? f.display.hint(f.values.role) : null;
    return (
        <BottomSheet
            visible
            onClose={onClose}
            title={f.isEdit ? t('roles.editUser') : t('roles.newUser')}
            footer={
                <Button
                    testID="user-save"
                    title={f.isEdit ? t('common.save') : t('roles.newUser')}
                    size="lg"
                    loading={f.busy}
                    onPress={() => void f.save()}
                />
            }
        >
            <View className="gap-4 pb-2">
                <TextField
                    testID="user-name"
                    label={t('auth.name')}
                    value={f.values.name}
                    onChangeText={(name) => f.change({ name })}
                    error={f.errors.name ? t(f.errors.name) : undefined}
                    autoComplete="name"
                />
                <TextField
                    testID="user-email"
                    label={t('auth.email')}
                    value={f.values.email}
                    onChangeText={(email) => f.change({ email })}
                    error={f.errors.email ? t(f.errors.email) : undefined}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                />
                {/* El rol va antes que la contraseña: lo último que se escribe es lo que
                    queda sobre el teclado, y el pie de la hoja no tapa el selector. */}
                <View className="gap-1">
                    <Select
                        label={t('roles.role')}
                        placeholder={t('roles.fieldRole')}
                        value={f.values.role}
                        options={f.roleOptions.map((role) => ({
                            value: role.slug,
                            label: f.display.label(role.slug),
                        }))}
                        error={f.errors.role ? t(f.errors.role) : undefined}
                        onChange={(role) => f.change({ role })}
                    />
                    {hint ? <Text className="text-sm text-muted-foreground">{hint}</Text> : null}
                </View>
                {f.needsPassword && (
                    <View className="gap-1">
                        <PasswordField
                            testID="user-password-input"
                            label={f.isEdit ? t('roles.newPassword') : t('auth.password')}
                            value={f.values.password}
                            onChangeText={(password) => f.change({ password })}
                            error={f.errors.password ? t(f.errors.password) : undefined}
                            autoComplete="new-password"
                        />
                        <Text className="text-sm text-muted-foreground">
                            {f.isEdit
                                ? t('roles.emailChangeNeedsPassword')
                                : t('auth.passwordHint')}
                        </Text>
                    </View>
                )}
                {f.failure ? <FieldError message={t(f.failure)} /> : null}
            </View>
        </BottomSheet>
    );
}
