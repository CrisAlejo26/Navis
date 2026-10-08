import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
    MODULE_LABEL_KEY,
    PERMISSION_ACTION_LABEL_KEY,
    PERMISSION_MODULES,
    permissionAction,
    permissionsOfModule,
    type Permission,
} from '@navis/shared';

import { Chip } from '@/components/ui/chip';

/**
 * Qué puede hacer un rol, módulo a módulo: una fila por módulo y una píldora por
 * acción (ver, gestionar, publicar). Es la misma tabla que en la web, pensada
 * para el pulgar: tocar la píldora la marca o la quita. El color es el del rol,
 * y cada píldora lleva su texto: el color no informa solo (Regla 3 §7).
 */
export function PermissionPicker({
    granted,
    color,
    onToggle,
}: {
    granted: readonly Permission[];
    color: string;
    onToggle: (permission: Permission, on: boolean) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-1">
            <Text className="font-sans-semibold text-base text-foreground">
                {t('permissions.title')}
            </Text>
            {PERMISSION_MODULES.map((module) => (
                <View
                    key={module}
                    testID={`permission-${module}`}
                    accessibilityRole="summary"
                    accessibilityLabel={t(MODULE_LABEL_KEY[module])}
                    className="py-2 flex-row flex-wrap items-center justify-between border-b border-border"
                    style={{ gap: 8 }}
                >
                    <Text className="text-sm text-foreground">{t(MODULE_LABEL_KEY[module])}</Text>
                    <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                        {permissionsOfModule(module).map((permission) => (
                            <Chip
                                key={permission}
                                label={t(PERMISSION_ACTION_LABEL_KEY[permissionAction(permission)])}
                                color={color}
                                selected={granted.includes(permission)}
                                onPress={() => onToggle(permission, !granted.includes(permission))}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </View>
    );
}
