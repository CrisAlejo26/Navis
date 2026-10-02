import type { ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function ListRoster({
    list,
    ink,
    background,
}: {
    list: ListSummary;
    ink: string;
    background: string;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-3 flex-row flex-wrap items-center">
            {list.initials.length ? (
                <View className="flex-row">
                    {list.initials.slice(0, 5).map((initial, index) => (
                        <View
                            key={index}
                            style={{
                                width: 36,
                                height: 36,
                                marginLeft: index ? -8 : 0,
                                borderWidth: 1.5,
                                borderColor: ink,
                                backgroundColor: background,
                                borderRadius: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text
                                style={{ color: ink, fontSize: 12 }}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.7}
                                className="font-sans-semibold"
                            >
                                {initial}
                            </Text>
                        </View>
                    ))}
                </View>
            ) : null}
            <Text style={{ color: ink }} className="text-sm font-sans-medium">
                {t('lists.people', { count: list.memberCount })}
            </Text>
        </View>
    );
}
