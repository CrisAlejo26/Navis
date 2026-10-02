import type { ListSummary } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { AppBar } from '@/components/ui/app-bar';
import { useThemeStore } from '@/lib/theme';
import { useStatusBarClaim } from '@/lib/status-bar';
import { listSurface } from '@/lib/lists/list-surface';
import { ListRoster } from './list-roster';

export function ListHeader({ list, onEdit }: { list: ListSummary; onEdit?: () => void }) {
    const { t } = useTranslation();
    const accent = accentHex(
        list.accent,
        useThemeStore((state) => state.resolvedTheme),
    );
    const { background: color, ink } = listSurface(accent);
    useStatusBarClaim(ink === '#ffffff' ? 'light' : 'dark');
    return (
        <View
            style={{
                backgroundColor: color,
                borderBottomLeftRadius: 32,
                borderBottomRightRadius: 32,
            }}
        >
            <AppBar
                title={t('nav.lists')}
                transparent
                foregroundColor={ink}
                onBack={() => (router.canGoBack() ? router.back() : router.replace('/lists'))}
                actions={
                    onEdit
                        ? [{ icon: 'ellipsis-horizontal', label: t('lists.edit'), onPress: onEdit }]
                        : []
                }
            />
            <View className="gap-3 px-5 pt-2 pb-6">
                <Text style={{ color: ink }} className="text-3xl font-sans-semibold">
                    {list.name}
                </Text>
                {list.description ? (
                    <Text style={{ color: ink }} className="text-base font-sans">
                        {list.description}
                    </Text>
                ) : null}
                <ListRoster list={list} ink={ink} background={color} />
                <Text style={{ color: ink }} className="text-xs font-sans">
                    {t(list.isActive ? 'lists.visibilityPrivate' : 'lists.inactive')}
                </Text>
            </View>
        </View>
    );
}
