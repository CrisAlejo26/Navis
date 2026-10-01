import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import type { LocalChurch } from '@/data/repos/church-repo';
import { Icon } from '@/components/ui/icon';
import { ChurchBadge } from './church-badge';

export function ChurchRow({
    church,
    current,
    disabled,
    onPress,
}: {
    church: LocalChurch;
    current: boolean;
    disabled?: boolean;
    onPress: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={church.name}
            accessibilityState={{ selected: current, disabled }}
            disabled={disabled}
            onPress={onPress}
            className="min-h-14 gap-3 py-3 flex-row items-center active:opacity-70"
        >
            <ChurchBadge id={church.id} muted={!current} />
            <View className="min-w-0 gap-0.5 flex-1">
                <Text className="text-base font-sans-semibold text-foreground" numberOfLines={2}>
                    {church.name}
                </Text>
                {church.city ? (
                    <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                        {church.city}
                    </Text>
                ) : null}
            </View>
            {current ? (
                <Icon
                    name="checkmark-circle"
                    tone="primary"
                    accessibilityLabel={t('church.current')}
                />
            ) : null}
        </Pressable>
    );
}
