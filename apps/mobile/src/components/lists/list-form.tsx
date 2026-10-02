import { createListSchema, type CreateListInput, type List } from '@navis/shared';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import { TextField } from '@/components/ui/text-field';
import { FieldError } from '@/components/ui/field-error';

export function ListForm({
    list,
    onClose,
    onSave,
}: {
    list?: List;
    onClose: () => void;
    onSave: (input: CreateListInput) => Promise<unknown>;
}) {
    const { t } = useTranslation();
    const [name, setName] = useState(list?.name ?? '');
    const [description, setDescription] = useState(list?.description ?? '');
    const [accent, setAccent] = useState(list?.accent ?? 'primary');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(false);
    const saving = useRef(false);
    async function save() {
        if (saving.current) return;
        const parsed = createListSchema.safeParse({ name, description, accent });
        if (!parsed.success) return setError(true);
        saving.current = true;
        setBusy(true);
        setError(false);
        try {
            await onSave(parsed.data);
            onClose();
        } catch {
            setError(true);
        } finally {
            saving.current = false;
            setBusy(false);
        }
    }
    return (
        <BottomSheet
            visible
            onClose={() => {
                if (!busy) onClose();
            }}
            title={t(list ? 'lists.edit' : 'lists.add')}
        >
            <View className="gap-4 pb-3">
                <TextField
                    label={t('lists.name')}
                    value={name}
                    onChangeText={setName}
                    maxLength={60}
                    editable={!busy}
                />
                <TextField
                    label={t('lists.description')}
                    value={description}
                    onChangeText={setDescription}
                    maxLength={280}
                    multiline
                    editable={!busy}
                />
                <ColorPicker
                    label={t('lists.color')}
                    value={accent}
                    onChange={setAccent}
                    disabled={busy}
                />
                {error ? <FieldError message={t('lists.saveFailed')} /> : null}
                <Button title={t('common.save')} loading={busy} onPress={() => void save()} />
            </View>
        </BottomSheet>
    );
}
