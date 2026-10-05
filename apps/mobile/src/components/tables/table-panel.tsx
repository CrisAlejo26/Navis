import type { CustomTable } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { tableIcons } from '@/lib/tables/icons';
import { useThemeStore } from '@/lib/theme';
import { listSurface } from '@/lib/lists/list-surface';

export function TablePanel({ table, onPress }: { table: CustomTable; onPress: () => void }) {
    const { t } = useTranslation();
    const theme = useThemeStore((state) => state.resolvedTheme);
    const { background, ink } = listSurface(accentHex(table.accent, theme));
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={table.name}
            onPress={onPress}
            className="gap-4 p-5 active:opacity-80"
            style={{ backgroundColor: background, borderRadius: 24 }}
        >
            <View className="gap-3 flex-row items-center">
                <Icon name={tableIcons[table.icon] ?? 'grid-outline'} color={ink} size="lg" />
                <Text style={{ color: ink }} className="text-xl font-sans-semibold flex-1">
                    {table.name}
                </Text>
                <Icon name="chevron-forward" color={ink} />
            </View>
            <Text style={{ color: ink }} className="text-sm font-sans">
                {t(
                    table.source === 'believers'
                        ? 'tables.mobile.linkedRows'
                        : 'tables.mobile.manualRows',
                )}
            </Text>
            {!table.isActive ? (
                <Text style={{ color: ink }} className="text-xs font-sans">
                    {t('tables.mobile.inactive')}
                </Text>
            ) : null}
        </Pressable>
    );
}
