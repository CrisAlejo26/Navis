import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { NotificationsCard } from '@/components/settings/notifications-card';
import { AppBar } from '@/components/ui/app-bar';

/**
 * Los avisos de este teléfono: permiso maestro, tipos y prueba. La franja de
 * «No molestar» llegará con los avisos que la usen (plan de ajustes, Fase 2).
 */
export default function NotificationsScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();

    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('notifications.title')} />
            <ScrollView
                contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: bottomPadding }}
            >
                <NotificationsCard />
            </ScrollView>
        </View>
    );
}
