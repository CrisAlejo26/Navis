import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { AppBar } from '@/components/ui/app-bar';
import { HeroScene } from '@/components/ui/hero-scene';
import { Ionicons } from '@expo/vector-icons';
import { SearchField } from '@/components/ui/search-field';
import { Switch } from '@/components/ui/switch';

export function TablesBoardHeader({
    scrollY,
    count,
    search,
    onSearch,
    inactive,
    onInactive,
}: {
    scrollY: SharedValue<number>;
    count: number;
    search: string;
    onSearch: (value: string) => void;
    inactive: boolean;
    onInactive: (value: boolean) => void;
}) {
    const { t } = useTranslation();
    return (
        <>
            <HeroScene scrollY={scrollY}>
                <AppBar
                    onScene
                    title={t('tables.title')}
                    onBack={() =>
                        router.canGoBack() ? router.back() : router.replace('/(tabs)/more')
                    }
                />
                <View className="gap-3 px-6 pt-3 pb-9 items-center">
                    <Ionicons
                        name="grid-outline"
                        size={48}
                        color="#ffffff"
                        importantForAccessibility="no-hide-descendants"
                    />
                    <Text style={{ color: '#ffffff' }} className="text-3xl font-sans-semibold">
                        {t('tables.mobile.countTables', { count })}
                    </Text>
                    <Text
                        style={{ color: 'rgba(255,255,255,0.85)', maxWidth: 320 }}
                        className="text-sm font-sans text-center"
                    >
                        {t('tables.mobile.localOnly')}
                    </Text>
                </View>
            </HeroScene>
            <View className="px-4 py-4 gap-3">
                <SearchField
                    value={search}
                    onChangeText={onSearch}
                    placeholder={t('common.search')}
                />
                <Switch
                    label={t('tables.mobile.showInactive')}
                    checked={inactive}
                    onChange={onInactive}
                />
            </View>
        </>
    );
}
