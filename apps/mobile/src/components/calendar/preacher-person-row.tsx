import { Ionicons } from '@expo/vector-icons';
import type { Preacher } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { formatDay } from '@/lib/format';
import { useThemeStore } from '@/lib/theme';

/** Un candidato del selector: cuándo subió por última vez, cuántas veces lleva y si va marcado. */
export function PreacherPersonRow({
    person,
    selected,
    onPress,
}: {
    person: Preacher;
    selected: boolean;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
    const times = t('calendar.timesInRange', { count: person.timesInRange });

    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={person.name}
            onPress={onPress}
            className="gap-3 min-h-[56px] flex-row items-center active:opacity-70"
        >
            <Avatar name={person.name} size="sm" />
            <View className="gap-0.5 flex-1">
                <Text className="text-base font-sans-medium text-foreground">{person.name}</Text>
                <Text className="text-xs text-muted-foreground">
                    {person.lastDate
                        ? `${t('calendar.lastTime', { date: formatDay(person.lastDate) })} · ${times}`
                        : `${t('calendar.never')} · ${times}`}
                </Text>
            </View>
            <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={selected ? palette.primary : palette.mutedForeground}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
            />
        </Pressable>
    );
}
