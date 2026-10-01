import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppBar } from '@/components/ui/app-bar';
import { BrandSplash } from '@/components/auth/brand-splash';
import { CreateChurchForm } from '@/components/church/create-church-form';
import { useLocalSession } from '@/stores/local-session';

export default function NewChurchScreen() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const hydrated = useLocalSession((state) => state.hydrated);
    if (!hydrated) return <BrandSplash />;
    if (!session) return <Redirect href="/(auth)/welcome" />;
    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('church.add')} />
            <CreateChurchForm />
        </View>
    );
}
