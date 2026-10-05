import type { CustomTable } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Text, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { AppBar } from '@/components/ui/app-bar';
import { Icon } from '@/components/ui/icon';
import { tableIcons } from '@/lib/tables/icons';
import { useThemeStore } from '@/lib/theme';
import { useStatusBarClaim } from '@/lib/status-bar';
import { listSurface } from '@/lib/lists/list-surface';

export function TableHeader({ table, onEdit }: { table: CustomTable; onEdit?: () => void }) {
    const { t } = useTranslation();
    const theme = useThemeStore((state) => state.resolvedTheme);
    const { height, fontScale } = useWindowDimensions();
    const compact = height < 500 || fontScale >= 1.6;
    const { background, ink } = listSurface(accentHex(table.accent, theme));
    useStatusBarClaim(ink === '#ffffff' ? 'light' : 'dark');
    return (
        <View
            style={{
                backgroundColor: background,
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
            }}
        >
            <AppBar
                title={compact ? table.name : t('tables.title')}
                transparent
                foregroundColor={ink}
                onBack={() => (router.canGoBack() ? router.back() : router.replace('/tables'))}
                actions={
                    onEdit
                        ? [
                              {
                                  icon: 'ellipsis-horizontal',
                                  label: t('tables.edit'),
                                  onPress: onEdit,
                              },
                          ]
                        : []
                }
            />
            {!compact ? (
                <View className="gap-3 px-5 pt-2 pb-6">
                    <View className="gap-3 flex-row items-center">
                        <Icon
                            name={tableIcons[table.icon] ?? 'grid-outline'}
                            color={ink}
                            size="lg"
                        />
                        <Text style={{ color: ink }} className="text-3xl font-sans-semibold flex-1">
                            {table.name}
                        </Text>
                    </View>
                    <Text style={{ color: ink }} className="text-xs font-sans">
                        {t('tables.mobile.localOnly')}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}
