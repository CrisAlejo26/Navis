import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { hasDemoData, seedDemoData } from '@/data/demo-data';
import { useLocalSession } from '@/stores/local-session';

/**
 * Herramientas de desarrollo: sembrar datos de prueba (desaparece en cuanto hay
 * creyentes) y el catálogo de componentes. Siguen a la vista porque la pantalla
 * de bienvenida ofrece entrar con datos de prueba (plan de ajustes, D2).
 */
export function DevToolsGroup() {
    const { t } = useTranslation();
    const session = useLocalSession((state) => state.session);
    const client = useQueryClient();

    const { data: seeded } = useQuery({
        queryKey: ['demo-data', session?.churchId],
        queryFn: () => hasDemoData(session!.churchId!),
        enabled: Boolean(session?.churchId),
    });

    const seed = useMutation({
        mutationFn: () => {
            if (!session?.churchId) throw new Error('Sin iglesia activa no se siembra');
            return seedDemoData(session.churchId, session.userId);
        },
        onSuccess: () => {
            for (const key of ['demo-data', 'believers', 'dashboard', 'catalog']) {
                void client.invalidateQueries({ queryKey: [key] });
            }
        },
    });

    return (
        <SettingsGroup label={t('settings.devOnly')}>
            {seeded ? null : (
                <SettingsRow
                    icon="leaf-outline"
                    title={t('settings.demoSeed')}
                    subtitle={t('settings.demoDescription')}
                    disabled={seed.isPending}
                    onPress={() => seed.mutate()}
                />
            )}
            <SettingsRow
                icon="grid"
                title={t('catalog.title')}
                subtitle={t('catalog.subtitle')}
                onPress={() => router.push('/components')}
            />
        </SettingsGroup>
    );
}
