import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Tag } from '@navis/shared';
import { RowEditorFrame } from '@/components/tables/row-editor-frame';
import { ColorPicker } from '@/components/ui/color-picker';
import { TextField } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { ActivityBlock } from './activity-block';
import { TagIconPicker } from './tag-icon-picker';
import { useTagEditor } from './use-tag-editor';
import { useTaskPalette } from './task-theme';
import { taskIcon } from '@/lib/tasks/icon-map';
import { hexAlpha, readableAccent } from '@/lib/color';
export function TagEditor({ previous }: { previous?: Tag }) {
    const f = useTagEditor(previous),
        { t } = useTranslation(),
        p = useTaskPalette(),
        accent = p.accent(f.draft.accent);
    return (
        <RowEditorFrame
            title={t(previous ? 'tasks.editTag' : 'tasks.addTag')}
            dirty={f.dirty || f.busy}
            onClose={() => router.back()}
            contentPadding={22}
            contentWidth={480}
            footer={
                <>
                    {f.error && <FieldError message={t('tasks.editor.invalidTag')} />}
                    <Button
                        title={t('common.save')}
                        className="rounded-2xl"
                        loading={f.busy}
                        onPress={() => void f.save()}
                    />
                </>
            }
        >
            <View className="gap-4 flex-row items-center">
                <View
                    style={{
                        width: 52,
                        height: 52,
                        borderRadius: 18,
                        backgroundColor: hexAlpha(accent, 0.12),
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Ionicons
                        name={taskIcon(f.draft.icon)}
                        size={28}
                        color={readableAccent(accent, p.card, p.foreground)}
                        aria-hidden
                    />
                </View>
                <Text className="font-sans-bold flex-1 text-[22px] text-foreground">
                    {f.draft.name || t('tasks.addTag')}
                </Text>
            </View>
            <TextField
                label={t('tasks.tagName')}
                value={f.draft.name}
                placeholder={t('tasks.tagNamePlaceholder')}
                maxLength={40}
                editable={!f.busy}
                onChangeText={(name) => f.change({ name })}
            />
            <ActivityBlock title={t('tasks.tagColor')}>
                <ColorPicker
                    label={t('tasks.tagColor')}
                    value={f.draft.accent}
                    disabled={f.busy}
                    onChange={(accent) => f.change({ accent })}
                />
            </ActivityBlock>
            <ActivityBlock title={t('tasks.tagIcon')}>
                <TagIconPicker
                    value={f.draft.icon}
                    accent={f.draft.accent}
                    disabled={f.busy}
                    onChange={(icon) => f.change({ icon })}
                />
            </ActivityBlock>
            {previous && (
                <Button
                    title={t('tasks.delete')}
                    variant="outline"
                    className="rounded-2xl"
                    leadingIcon="trash-outline"
                    disabled={f.busy}
                    onPress={f.remove}
                />
            )}
        </RowEditorFrame>
    );
}
