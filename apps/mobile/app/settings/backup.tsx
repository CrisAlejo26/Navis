import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Text, View } from 'react-native';

import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PasswordField } from '@/components/ui/password-field';
import { useBackup, type BackupOutcome } from '@/hooks/use-backup';

/**
 * Sacar los datos del teléfono y volver a meterlos. En local el teléfono es la
 * única copia: esta pantalla es la única red de seguridad que hay.
 */
export default function BackupScreen() {
    const bottomPadding = usePageBottomPadding();
    const { t } = useTranslation();
    const { busy, exportBackup, pickBackup, restore } = useBackup();
    const [outcome, setOutcome] = useState<BackupOutcome | null>(null);
    const [secret, setSecret] = useState('');

    async function onExport(): Promise<void> {
        setOutcome(null);
        setOutcome(await exportBackup(secret));
    }

    async function onRestore(): Promise<void> {
        setOutcome(null);
        const file = await pickBackup();
        if (!file) return;
        Alert.alert(t('backup.restoreConfirmTitle'), t('backup.restoreConfirmBody'), [
            { text: t('common.cancel'), style: 'cancel' },
            {
                text: t('backup.restoreConfirmAction'),
                style: 'destructive',
                onPress: () => void restore(file, secret).then(setOutcome),
            },
        ]);
    }

    const message = outcome
        ? outcome.kind === 'restored'
            ? t('backup.restored')
            : t(ERROR_KEYS[outcome.code])
        : null;

    return (
        <View className="flex-1 bg-background">
            <AppBar title={t('backup.title')} />
            <ScrollView
                contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: bottomPadding }}
            >
                <Text className="text-sm text-muted-foreground">{t('backup.intro')}</Text>
                <PasswordField
                    label={t('tables.mobile.recoverySecret')}
                    value={secret}
                    onChangeText={setSecret}
                />
                <Text className="font-sans text-muted-foreground">
                    {t('tables.mobile.recoveryHint')}
                </Text>
                <Card title={t('backup.exportTitle')} description={t('backup.exportBody')}>
                    <Button
                        title={t('backup.exportButton')}
                        size="lg"
                        className="mt-2"
                        loading={busy === 'export'}
                        disabled={busy !== null}
                        onPress={() => void onExport()}
                    />
                </Card>
                <Card title={t('backup.restoreTitle')} description={t('backup.restoreBody')}>
                    <Button
                        title={t('backup.restoreButton')}
                        variant="secondary"
                        size="lg"
                        className="mt-2"
                        loading={busy === 'restore'}
                        disabled={busy !== null}
                        onPress={() => void onRestore()}
                    />
                </Card>
                {message ? (
                    <Text
                        accessibilityLiveRegion="polite"
                        className={
                            outcome?.kind === 'restored'
                                ? 'text-sm text-success'
                                : 'text-sm text-destructive'
                        }
                    >
                        {message}
                    </Text>
                ) : null}
            </ScrollView>
        </View>
    );
}

const ERROR_KEYS = {
    invalid: 'backup.errorInvalid',
    newer: 'backup.errorNewer',
    generic: 'backup.errorGeneric',
    exportFailed: 'backup.exportFailed',
} as const;
