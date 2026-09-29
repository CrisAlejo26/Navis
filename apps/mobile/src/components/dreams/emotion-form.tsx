import { ACCENT_PALETTE } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';

export interface EmotionDraft {
    /** Nulo al crear una nueva. */
    id: string | null;
    name: string;
    accent: string;
}

interface EmotionFormProps {
    draft: EmotionDraft;
    onCancel: () => void;
    onSave: (draft: EmotionDraft) => Promise<void>;
}

/**
 * Crear o cambiar una emoción propia (RFC 0005 D7): un nombre y un color de
 * `ACCENT_PALETTE`, la misma paleta de dieciséis tonos que ya se lee en claro
 * y en oscuro. El color elegido lleva además un aro y `selected` para el
 * lector de pantalla: el color no informa solo (Regla 3 §7).
 */
export function EmotionForm({ draft, onCancel, onSave }: EmotionFormProps) {
    const { t } = useTranslation();
    const [values, setValues] = useState(draft);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);

    async function save() {
        if (values.name.trim() === '') return setError(true);
        setSaving(true);
        try {
            await onSave({ ...values, name: values.name.trim() });
        } catch {
            setError(true);
        } finally {
            setSaving(false);
        }
    }

    return (
        <View className="gap-3">
            <TextField
                label={t('dreams.emotionName')}
                value={values.name}
                onChangeText={(name) => setValues({ ...values, name })}
                placeholder={t('dreams.emotionNamePlaceholder')}
                autoFocus
                error={error ? t('errors.generic') : undefined}
            />
            <Text className="text-sm font-sans-medium text-foreground">
                {t('dreams.emotionColor')}
            </Text>
            <View className="gap-2 flex-row flex-wrap">
                {ACCENT_PALETTE.map((accent) => (
                    <Pressable
                        key={accent}
                        accessibilityRole="button"
                        accessibilityLabel={accent}
                        accessibilityState={{ selected: values.accent === accent }}
                        onPress={() => setValues({ ...values, accent })}
                        className="size-9 rounded-full"
                        style={{
                            backgroundColor: accent,
                            borderWidth: values.accent === accent ? 3 : 0,
                            borderColor: '#ffffff',
                            opacity: values.accent === accent ? 1 : 0.85,
                        }}
                    />
                ))}
            </View>
            <View className="gap-2 flex-row">
                <Button title={t('common.cancel')} variant="secondary" onPress={onCancel} />
                <Button title={t('common.save')} loading={saving} onPress={() => void save()} />
            </View>
        </View>
    );
}
