import { todayIn } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';

interface DreamFulfillSheetProps {
    visible: boolean;
    onClose: () => void;
    /** Lo que ya estaba escrito, si se está corrigiendo un cumplimiento. */
    current: { fulfilledAt: string | null; meaning: string | null };
    onSave: (values: { fulfilledAt: string; meaning: string }) => Promise<void>;
}

/**
 * Marcar un sueño como cumplido (RFC 0005 D10): el día en que pasó y qué
 * significó, en el momento en que se sabe. Se monta al abrirse para que su
 * estado nazca ya con los valores, sin efectos que pisen lo escrito. Volver a
 * abrirlo es aparte (`reopen`): quitar la fecha se lleva lo que significó.
 */
export function DreamFulfillSheet(props: DreamFulfillSheetProps) {
    if (!props.visible) return null;
    return <FulfillBody {...props} />;
}

function FulfillBody({ onClose, current, onSave }: DreamFulfillSheetProps) {
    const { t } = useTranslation();
    const [fulfilledAt, setFulfilledAt] = useState(current.fulfilledAt ?? todayIn('UTC'));
    const [meaning, setMeaning] = useState(current.meaning ?? '');
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    async function save() {
        setSaving(true);
        try {
            await onSave({ fulfilledAt, meaning });
            onClose();
        } catch {
            // Lo único que puede fallar aquí es D12: cumplirse antes de soñarse.
            setError(t('dreams.errorOrder'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <BottomSheet visible onClose={onClose} title={t('dreams.fulfillTitle')}>
            <View className="gap-4">
                <DatePicker
                    label={t('dreams.fulfilledAt')}
                    value={fulfilledAt}
                    placeholder={t('dreams.fulfilledAt')}
                    onChange={setFulfilledAt}
                />
                <TextField
                    label={t('dreams.meaning')}
                    value={meaning}
                    onChangeText={setMeaning}
                    placeholder={t('dreams.meaningPlaceholder')}
                    multiline
                    numberOfLines={4}
                    error={error ?? undefined}
                />
                <Button title={t('common.save')} loading={saving} onPress={() => void save()} />
            </View>
        </BottomSheet>
    );
}
