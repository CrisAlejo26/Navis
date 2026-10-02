import type { ListSummary } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { useThemeStore } from '@/lib/theme';
import { readableInk } from '@/lib/lists/readable-ink';

export function ListPanel({ list, onPress }: { list: ListSummary; onPress: () => void }) {
    const { t } = useTranslation();
    const color = accentHex(
        list.accent,
        useThemeStore((state) => state.resolvedTheme),
    );
    const ink = readableInk(color);
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${list.name}, ${t('lists.people', { count: list.memberCount })}`}
            onPress={onPress}
            className="gap-3 p-5 rounded-2xl active:opacity-80"
            style={{ backgroundColor: color }}
        >
            <Text style={{ color: ink }} className="text-xl font-sans-semibold">
                {list.name}
            </Text>
            {list.description ? (
                <Text style={{ color: ink }} className="text-sm font-sans">
                    {list.description}
                </Text>
            ) : null}
            <View className="gap-2 flex-row flex-wrap items-center">
                {list.initials.map((initial, index) => (
                    <View
                        key={index}
                        className="h-9 w-9 items-center justify-center rounded-full"
                        style={{ borderWidth: 1, borderColor: ink }}
                    >
                        <Text
                            style={{ color: ink }}
                            className="text-xs font-sans-semibold"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.7}
                        >
                            {initial}
                        </Text>
                    </View>
                ))}
                <Text style={{ color: ink }} className="text-sm font-sans-medium">
                    {t('lists.people', { count: list.memberCount })}
                </Text>
            </View>
            <Text style={{ color: ink }} className="text-xs font-sans">
                {t(list.isActive ? 'lists.visibilityPrivate' : 'lists.inactive')}
            </Text>
        </Pressable>
    );
}
