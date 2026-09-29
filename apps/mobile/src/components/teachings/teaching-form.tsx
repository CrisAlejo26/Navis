import { createTeachingSchema, todayIn, type Teaching } from '@navis/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { TeachingEditor } from '@/components/teachings/editor/teaching-editor';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { FieldError } from '@/components/ui/field-error';
import { TextField } from '@/components/ui/text-field';
import { useCreateTeaching, useUpdateTeaching } from '@/hooks/use-teachings';
import { blocksToBody, bodyToBlocks, type EditorBlock } from '@/lib/teachings/editor-model';
import { EMPTY_TEACHING_BODY } from '@navis/shared';

const DEVICE_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Alta y edición de una enseñanza, ya con los datos cargados. La pantalla lo
 * monta con `key` cuando llegan, para que su estado nazca correcto y ningún
 * `refetch` pise lo que se está escribiendo (CLAUDE.md, `ProphecyFormBody`).
 *
 * Es una pantalla y no una hoja (plan `ensenanzas-movil-plan.md` §4.5): el
 * editor y su barra de formato necesitan todo el alto con el teclado abierto.
 */
export function TeachingForm({ teaching }: { teaching?: Teaching }) {
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const create = useCreateTeaching();
    const update = useUpdateTeaching();

    const [title, setTitle] = useState(teaching?.title ?? '');
    const [receivedAt, setReceivedAt] = useState(teaching?.receivedAt ?? todayIn(DEVICE_TIMEZONE));
    const [blocks, setBlocks] = useState<EditorBlock[]>(() =>
        bodyToBlocks(teaching?.body ?? EMPTY_TEACHING_BODY),
    );
    const [error, setError] = useState<string | null>(null);
    const saving = create.isPending || update.isPending;

    async function save() {
        const parsed = createTeachingSchema.safeParse({
            title,
            body: blocksToBody(blocks),
            receivedAt,
        });
        if (!parsed.success) {
            setError(t('errors.generic'));
            return;
        }
        try {
            if (teaching) await update.mutateAsync({ id: teaching.id, input: parsed.data });
            else await create.mutateAsync(parsed.data);
            router.back();
        } catch {
            setError(t('errors.generic'));
        }
    }

    return (
        <View className="flex-1 bg-background">
            <AppBar title={teaching ? t('teachings.edit') : t('teachings.add')} />
            <TeachingEditor
                blocks={blocks}
                onChange={setBlocks}
                header={
                    <View className="gap-3">
                        <TextField
                            label={t('teachings.titleField')}
                            value={title}
                            onChangeText={setTitle}
                            placeholder={t('teachings.titlePlaceholder')}
                            autoFocus={!teaching}
                            maxLength={200}
                        />
                        <DatePicker
                            label={t('teachings.receivedAtField')}
                            value={receivedAt}
                            placeholder={t('teachings.receivedAtField')}
                            onChange={setReceivedAt}
                            timezone={DEVICE_TIMEZONE}
                        />
                        {error ? <FieldError message={error} /> : null}
                    </View>
                }
                footer={
                    <View
                        className="px-4 pt-3 border-t border-border bg-background"
                        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
                    >
                        <Button
                            title={t('common.save')}
                            size="lg"
                            loading={saving}
                            disabled={title.trim().length === 0}
                            onPress={() => void save()}
                        />
                    </View>
                }
            />
        </View>
    );
}
