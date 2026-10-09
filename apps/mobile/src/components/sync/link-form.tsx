import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { TextField } from '@/components/ui/text-field';
import { useLinkDevice } from '@/hooks/use-link-device';
import type { LinkErrorCode } from '@/lib/sync/link-device';

const ERROR_KEYS = {
    invalidUrl: 'sync.error.invalidUrl',
    insecureUrl: 'sync.error.insecureUrl',
    unreachable: 'sync.error.unreachable',
    incompatible: 'sync.error.incompatible',
    invalidToken: 'sync.error.invalidToken',
    generic: 'sync.error.generic',
} as const satisfies Record<LinkErrorCode, string>;

const STEPS = ['sync.step1', 'sync.step2', 'sync.step3'] as const;

/** Los tres pasos son una secuencia real: web → copiar → pegar aquí. */
function Steps() {
    const { t } = useTranslation();
    return (
        <View className="gap-3 p-4 rounded-[26px] bg-card">
            {STEPS.map((key, index) => (
                <View key={key} className="gap-3 flex-row items-start">
                    <View className="size-6 items-center justify-center rounded-full bg-primary/15">
                        <Text className="text-xs font-sans-semibold text-primary">{index + 1}</Text>
                    </View>
                    <Text className="text-sm font-sans flex-1 text-foreground">{t(key)}</Text>
                </View>
            ))}
        </View>
    );
}

export function LinkForm() {
    const { t } = useTranslation();
    const form = useLinkDevice();
    const busyLabel = form.busy === 'checking' ? t('sync.checking') : t('sync.state.linking');

    return (
        <View className="gap-4">
            <Steps />
            <TextField
                label={t('sync.apiUrlLabel')}
                value={form.url}
                onChangeText={form.setUrl}
                placeholder={t('sync.urlPlaceholder')}
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextField
                label={t('sync.tokenLabel')}
                value={form.token}
                onChangeText={form.setToken}
                autoCapitalize="none"
                autoCorrect={false}
            />
            <TextField
                label={t('sync.deviceNameLabel')}
                value={form.deviceName}
                onChangeText={form.setDeviceName}
                maxLength={80}
            />
            {form.error ? <FieldError message={t(ERROR_KEYS[form.error])} /> : null}
            <Button
                title={form.busy ? busyLabel : t('sync.connect')}
                size="lg"
                loading={form.busy !== null}
                disabled={!form.canSubmit || form.busy !== null}
                onPress={() => void form.submit()}
            />
        </View>
    );
}
