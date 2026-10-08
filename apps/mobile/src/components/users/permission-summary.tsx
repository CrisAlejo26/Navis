import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    ALL_PERMISSIONS,
    MODULE_LABEL_KEY,
    PERMISSION_ACTION_LABEL_KEY,
    PERMISSION_MODULES,
    grantedByModule,
    permissionAction,
    type RoleRow,
} from '@navis/shared';

import { Chip } from '@/components/ui/chip';

/**
 * Qué puede hacer el rol, leído por filas: «¿qué ve recepción?» se responde mirando
 * una. Solo salen los módulos de los que tiene algo; el superadministrador tiene el
 * comodín y no se desglosa.
 */
export function PermissionSummary({ role, color }: { role: RoleRow; color: string }) {
    const { t } = useTranslation();
    const rows = grantedByModule(role.permissions, PERMISSION_MODULES);
    return (
        <View className="gap-1 rounded-3xl p-4 bg-card">
            <Text className="font-sans-semibold text-base text-foreground">
                {t('permissions.title')}
            </Text>
            {role.permissions.includes(ALL_PERMISSIONS) ? (
                <Text className="text-sm text-muted-foreground">
                    {t('permissions.superadminLocked')}
                </Text>
            ) : rows.length === 0 ? (
                <Text className="text-sm text-muted-foreground">{t('roles.noPermissions')}</Text>
            ) : (
                rows.map(({ module, permissions }) => (
                    <View
                        key={module}
                        testID={`summary-${module}`}
                        className="py-2 flex-row flex-wrap items-center justify-between border-b border-border"
                        style={{ gap: 8 }}
                    >
                        <Text className="text-sm text-foreground">
                            {t(MODULE_LABEL_KEY[module])}
                        </Text>
                        <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                            {permissions.map((permission) => (
                                <Chip
                                    key={permission}
                                    label={t(
                                        PERMISSION_ACTION_LABEL_KEY[permissionAction(permission)],
                                    )}
                                    color={color}
                                    selected
                                />
                            ))}
                        </View>
                    </View>
                ))
            )}
        </View>
    );
}
