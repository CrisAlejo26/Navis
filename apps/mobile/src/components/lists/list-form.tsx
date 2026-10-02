import { ACCENT_PALETTE, createListSchema, type CreateListInput, type List } from '@navis/shared';
import { accentHex } from '@navis/theme';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { TextField } from '@/components/ui/text-field';
import { FieldError } from '@/components/ui/field-error';
import { useThemeStore } from '@/lib/theme';

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
    const theme = useThemeStore((state) => state.resolvedTheme);
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
                <View className="gap-2 flex-row flex-wrap">
                    {['primary', ...ACCENT_PALETTE]
                        .filter((one, index, all) => all.indexOf(one) === index)
                        .map((color, index) => (
                            <Chip
                                key={color}
                                label={t('lists.colorOption', { number: index + 1 })}
                                color={accentHex(color, theme)}
                                selected={accent === color}
                                disabled={busy}
                                onPress={() => setAccent(color)}
                            />
                        ))}
                </View>
                {error ? <FieldError message={t('lists.saveFailed')} /> : null}
                <Button title={t('common.save')} loading={busy} onPress={() => void save()} />
            </View>
        </BottomSheet>
    );
}
