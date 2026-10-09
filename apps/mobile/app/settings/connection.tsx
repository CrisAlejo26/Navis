import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';

import { LinkForm } from '@/components/sync/link-form';
import { LinkTrail } from '@/components/sync/link-trail';
import { LinkedCard } from '@/components/sync/linked-card';
import { AppBar } from '@/components/ui/app-bar';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useSyncConnection } from '@/stores/sync-connection';

/**
 * Conexión con una instalación web (sincronización, Fase 1). Vincula con un
 * código de un solo uso y nada más: los datos del teléfono no se leen ni se
 * envían todavía, y desvincular devuelve al modo local sin borrar nada.
 */
export default function ConnectionScreen() {
    const { t } = useTranslation();
    const bottomPadding = usePageBottomPadding();
    const link = useSyncConnection((state) => state.link);

    return (
        <View className="flex-1 bg-muted dark:bg-background">
            <AppBar title={t('settings.connection')} />
            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingVertical: 16, paddingBottom: bottomPadding }}
                >
                    <View
                        style={{
                            width: '100%',
                            maxWidth: 520,
                            alignSelf: 'center',
                            paddingHorizontal: 22,
                            gap: 20,
                        }}
                    >
                        <LinkTrail
                            linked={Boolean(link)}
                            phoneLabel={t('sync.thisDevice')}
                            serverLabel={link ? link.installationName : t('sync.state.local')}
                            description={link ? t('sync.state.connected') : t('sync.state.local')}
                        />
                        {link ? (
                            <LinkedCard link={link} />
                        ) : (
                            <>
                                <Text className="text-base font-sans text-muted-foreground">
                                    {t('sync.mobileIntro')}
                                </Text>
                                <LinkForm />
                            </>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
