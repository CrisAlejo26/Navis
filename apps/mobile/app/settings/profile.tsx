import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { ProfileForm } from '@/components/settings/profile-form';
import { AppBar } from '@/components/ui/app-bar';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalUser } from '@/hooks/use-settings';

export default function ProfileScreen() {
    const { t } = useTranslation();
    const { data: user } = useLocalUser();

    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('profile.title')} />
            {user ? (
                <ProfileForm key={user.id} user={user} />
            ) : (
                <View className="gap-4 p-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </View>
            )}
        </View>
    );
}
