import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ChurchForm } from '@/components/settings/church-form';
import { AppBar } from '@/components/ui/app-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalChurch } from '@/hooks/use-settings';

export default function ChurchScreen() {
    const { t } = useTranslation();
    const { data: church } = useLocalChurch();

    return (
        <View className="flex-1 bg-background">
            <AppBar title={church?.name ?? t('settings.churchData')} />
            {church ? (
                <ChurchForm key={church.id} church={church} />
            ) : (
                <View className="gap-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </View>
            )}
        </View>
    );
}
