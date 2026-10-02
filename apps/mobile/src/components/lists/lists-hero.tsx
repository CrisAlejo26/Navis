import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export function ListsHero({ count }: { count: number }) {
    const { t } = useTranslation();
    return (
        <View className="gap-3 px-6 pt-3 pb-9 items-center">
            <View className="gap-3 flex-row items-center">
                <Ionicons
                    name="people-outline"
                    size={48}
                    color="#ffffff"
                    importantForAccessibility="no-hide-descendants"
                />
            </View>
            <Text style={{ color: '#ffffff' }} className="text-3xl font-sans-semibold">
                {t('lists.countLists', { count })}
            </Text>
            <Text
                style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 320 }}
                className="text-sm font-sans text-center"
            >
                {t('lists.heroDescription')}
            </Text>
        </View>
    );
}
