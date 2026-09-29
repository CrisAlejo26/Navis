import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import {
    dreamFormFrom,
    emptyDreamForm,
    isDreamFormValid,
    type DreamFormValues,
} from '@/components/dreams/dream-form-values';
import { DreamAudioField } from '@/components/dreams/dream-audio-field';
import { EmotionPicker } from '@/components/dreams/emotion-picker';
import { EmotionsManager } from '@/components/dreams/emotions-manager';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';
import type { LocalDream } from '@/data/repos/dreams-repo';
import { useSheetBodyMaxHeight } from '@/lib/ui/keyboard';

interface DreamFormSheetProps {
    visible: boolean;
    onClose: () => void;
    /** El sueño que se edita, o `null` para apuntar uno nuevo. */
    dream: LocalDream | null;
    onSave: (values: DreamFormValues) => Promise<void>;
}

/**
 * Apuntar/editar un sueño (RFC 0005 §7.4): **solo el cuerpo es obligatorio**,
 * porque a las cuatro de la mañana nadie titula (D17). Se monta con `key` cuando
 * ya hay valores, como `ProphecyFormSheet`, para que ningún `refetch` pise lo
 * que se está escribiendo. El gestor de emociones **sustituye** al formulario
 * dentro de la misma hoja: dos `Modal` apilados no se llevan en iOS.
 */
export function DreamFormSheet(props: DreamFormSheetProps) {
    if (!props.visible) return null;
    return <DreamFormBody key={props.dream?.id ?? 'new'} {...props} />;
}

function DreamFormBody({ onClose, dream, onSave }: DreamFormSheetProps) {
    const { t } = useTranslation();
    const bodyMaxHeight = useSheetBodyMaxHeight(0.68);
    const [values, setValues] = useState<DreamFormValues>(() =>
        dream ? dreamFormFrom(dream) : emptyDreamForm(),
    );
    const [managing, setManaging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const set = (patch: Partial<DreamFormValues>) => setValues({ ...values, ...patch });

    async function save() {
        if (!isDreamFormValid(values)) return setError(t('dreams.errorEmpty'));
        setSaving(true);
        try {
            await onSave(values);
            onClose();
        } catch {
            setError(t('dreams.errorOrder'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <BottomSheet
            visible
            onClose={onClose}
            title={
                managing ? t('dreams.emotionsManage') : dream ? t('dreams.edit') : t('dreams.add')
            }
        >
            {managing ? (
                <EmotionsManager onBack={() => setManaging(false)} />
            ) : (
                <>
                    <ScrollView
                        style={{ maxHeight: bodyMaxHeight }}
                        contentContainerClassName="gap-4"
                        showsVerticalScrollIndicator={false}
                    >
                        <TextField
                            label={t('dreams.bodyField')}
                            value={values.body}
                            onChangeText={(body) => set({ body })}
                            placeholder={t('dreams.bodyPlaceholder')}
                            multiline
                            numberOfLines={6}
                            autoFocus={!dream}
                            error={error ?? undefined}
                        />
                        <DatePicker
                            label={t('dreams.dreamedAt')}
                            value={values.dreamedAt}
                            placeholder={t('dreams.dreamedAt')}
                            onChange={(dreamedAt) => set({ dreamedAt })}
                        />
                        <TextField
                            label={t('dreams.titleField')}
                            value={values.title}
                            onChangeText={(title) => set({ title })}
                            placeholder={t('dreams.titlePlaceholder')}
                        />
                        <View className="gap-2">
                            <Text className="text-sm font-sans-medium text-foreground">
                                {t('dreams.emotionsLabel')}
                            </Text>
                            <EmotionPicker
                                value={values.emotionIds}
                                onChange={(emotionIds) => set({ emotionIds })}
                                onManage={() => setManaging(true)}
                            />
                        </View>
                        <TextField
                            label={t('dreams.interpretation')}
                            value={values.interpretation}
                            onChangeText={(interpretation) => set({ interpretation })}
                            placeholder={t('dreams.interpretationPlaceholder')}
                            multiline
                            numberOfLines={4}
                        />
                        <DreamAudioField
                            value={values.pendingAudios}
                            onChange={(pendingAudios) => set({ pendingAudios })}
                        />
                    </ScrollView>
                    <Button
                        title={t('common.save')}
                        loading={saving}
                        onPress={() => void save()}
                        className="mt-2"
                    />
                </>
            )}
        </BottomSheet>
    );
}
