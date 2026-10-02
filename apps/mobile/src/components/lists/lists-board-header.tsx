import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import { AppBar } from '@/components/ui/app-bar';
import { HeroScene } from '@/components/ui/hero-scene';
import { Switch } from '@/components/ui/switch';
import { ListsHero } from './lists-hero';

export function ListsBoardHeader({
    scrollY,
    count,
    inactive,
    onChange,
}: {
    scrollY: SharedValue<number>;
    count: number;
    inactive: boolean;
    onChange: (value: boolean) => void;
}) {
    const { t } = useTranslation();
    return (
        <>
            <HeroScene scrollY={scrollY}>
                <AppBar
                    onScene
                    title={t('nav.lists')}
                    onBack={() =>
                        router.canGoBack() ? router.back() : router.replace('/(tabs)/more')
                    }
                />
                <ListsHero count={count} />
            </HeroScene>
            <View className="px-4 py-4">
                <Switch label={t('lists.showInactive')} checked={inactive} onChange={onChange} />
            </View>
        </>
    );
}
