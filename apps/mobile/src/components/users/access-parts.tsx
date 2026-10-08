import { accentHex } from '@navis/theme';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { ListSummary } from '@navis/shared';

import { hexAlpha } from '@/lib/color';
import { useThemeStore } from '@/lib/theme';
import type { AccessStatus } from '@/lib/users/access-status';
import { useUserPalette } from './user-theme';

/** El color y el texto de cada estado: nunca solo el color (Regla 3 §7). */
export function useAccessStatusDisplay() {
    const p = useUserPalette(),
        { t } = useTranslation();
    return (status: AccessStatus): { color: string; label: string } =>
        ({
            active: { color: p.success, label: t('lists.active') },
            expired: { color: p.warning, label: t('roles.accessExpired') },
            inactive: { color: p.mutedForeground, label: t('roles.accessInactive') },
        })[status];
}

/** Una pastilla por lista que abre el acceso, en el color de esa lista. */
export function ListPill({ list }: { list: Pick<ListSummary, 'name' | 'accent'> }) {
    const theme = useThemeStore((state) => state.resolvedTheme),
        p = useUserPalette();
    const color = accentHex(list.accent, theme);
    return (
        <View
            className="flex-row items-center"
            style={{
                gap: 6,
                borderRadius: 999,
                paddingVertical: 3,
                paddingHorizontal: 9,
                backgroundColor: hexAlpha(color, 0.14),
            }}
        >
            <View
                aria-hidden
                style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }}
            />
            <Text className="text-xs" style={{ color: p.foreground }} numberOfLines={1}>
                {list.name}
            </Text>
        </View>
    );
}
