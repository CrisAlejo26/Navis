import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { AppBar } from '@/components/ui/app-bar';
import { BrandSplash } from '@/components/auth/brand-splash';
import { ChurchList } from '@/components/church/church-list';
import { useLocalSession } from '@/stores/local-session';

export default function MyChurchesScreen() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const hydrated = useLocalSession((state) => state.hydrated);
    if (!hydrated) return <BrandSplash />;
    if (!session) return <Redirect href="/(auth)/welcome" />;
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('church.mine')} />
            <ScrollView contentContainerClassName="px-5 pb-12">
                <ChurchList />
            </ScrollView>
        </View>
    );
}
