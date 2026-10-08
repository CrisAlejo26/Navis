import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPERADMIN_ROLE, type RoleRow } from '@navis/shared';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { Icon } from '@/components/ui/icon';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { PermissionPicker } from './permission-picker';
import { ROLE_LEVELS, useRoleForm } from './use-role-form';

/** Un aviso con candado: lo que ese rol no deja cambiar, dicho en vez de callado. */
function Locked({ text }: { text: string }) {
    return (
        <View className="rounded-2xl p-3 flex-row items-center bg-muted" style={{ gap: 10 }}>
            <Icon name="lock-closed-outline" size="sm" />
            <Text className="text-sm flex-1 text-muted-foreground">{text}</Text>
        </View>
    );
}

/**
 * Alta (sin `role`) y edición de un rol. De uno de serie no se ofrecen ni el
 * nombre —se traduce— ni el nivel; del superadministrador, tampoco los permisos.
 */
export function RoleFormSheet({ role, onClose }: { role?: RoleRow; onClose: () => void }) {
    const { t } = useTranslation(),
        f = useRoleForm(role, onClose);
    return (
        <BottomSheet
            visible
            onClose={onClose}
            title={f.isEdit ? t('roles.editRole') : t('roles.newRole')}
            footer={
                <Button
                    testID="role-save"
                    title={f.isEdit ? t('common.save') : t('roles.newRole')}
                    size="lg"
                    loading={f.busy}
                    onPress={() => void f.save()}
                />
            }
        >
            <View className="gap-4 pb-2">
                {role?.isSystem ? (
                    <Locked text={t('roles.systemRoleLocked')} />
                ) : (
                    <>
                        <TextField
                            testID="role-name"
                            label={t('roles.roleName')}
                            value={f.values.name}
                            onChangeText={(name) => f.change({ name })}
                            error={f.errors.name ? t(f.errors.name) : undefined}
                            autoComplete="off"
                        />
                        <View className="gap-1">
                            <Select
                                label={t('roles.roleLevel')}
                                placeholder={t('roles.roleLevel')}
                                value={String(f.values.level)}
                                options={ROLE_LEVELS.map((level) => ({
                                    value: String(level),
                                    label: String(level),
                                }))}
                                onChange={(level) => f.change({ level: Number(level) })}
                            />
                            <Text className="text-sm text-muted-foreground">
                                {t('roles.roleLevelHint')}
                            </Text>
                        </View>
                    </>
                )}
                <TextField
                    testID="role-description"
                    label={t('roles.roleDescription')}
                    value={f.values.description}
                    onChangeText={(description) => f.change({ description })}
                    autoComplete="off"
                />
                {role?.slug === SUPERADMIN_ROLE ? (
                    <Locked text={t('permissions.superadminLocked')} />
                ) : (
                    <PermissionPicker
                        granted={f.values.permissions}
                        color={f.color}
                        onToggle={f.toggle}
                    />
                )}
                {f.failure ? <FieldError message={t(f.failure)} /> : null}
            </View>
        </BottomSheet>
    );
}
