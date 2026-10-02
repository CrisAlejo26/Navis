import type { ListSummary } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useThemeStore } from '@/lib/theme';
import { listSurface } from '@/lib/lists/list-surface';
import { ListRoster } from './list-roster';

export function ListPanel({ list, onPress }: { list: ListSummary; onPress: () => void }) {
    const { t } = useTranslation();
    const accent = accentHex(
        list.accent,
        useThemeStore((state) => state.resolvedTheme),
    );
    const { background: color, ink } = listSurface(accent);
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${list.name}, ${t('lists.people', { count: list.memberCount })}`}
            onPress={onPress}
            className="gap-4 p-5 active:opacity-80"
            style={{ backgroundColor: color, borderRadius: 24 }}
        >
            <View className="gap-3 flex-row items-center">
                <Text style={{ color: ink }} className="text-xl font-sans-semibold flex-1">
                    {list.name}
                </Text>
                <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={ink}
                    importantForAccessibility="no-hide-descendants"
                />
            </View>
            {list.description ? (
                <Text style={{ color: ink }} className="text-sm font-sans" numberOfLines={2}>
                    {list.description}
                </Text>
            ) : null}
            <ListRoster list={list} ink={ink} background={color} />
            {!list.isActive ? (
                <Text style={{ color: ink }} className="text-xs font-sans">
                    {t('lists.inactive')}
                </Text>
            ) : null}
        </Pressable>
    );
}
