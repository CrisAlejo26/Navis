import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BrandHeader } from '@/components/auth/brand-header';
import { CreateChurchForm } from '@/components/church/create-church-form';

/** Alta bloqueante; las iglesias adicionales se crean fuera de auth. */
export default function ChurchSetupScreen() {
    const { t } = useTranslation();
    return (
        <View className="flex-1 bg-background">
            <BrandHeader tagline={false} />
            <Text className="px-5 text-2xl font-sans-semibold text-foreground">
                {t('church.welcomeTitle')}
            </Text>
            <CreateChurchForm />
        </View>
    );
}
