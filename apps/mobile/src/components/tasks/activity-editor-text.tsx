import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/ui/text-field';
import type { useActivityEditor } from './use-activity-editor';
export function ActivityEditorText({ state: f }: { state: ReturnType<typeof useActivityEditor> }) {
    const { t } = useTranslation(),
        d = f.draft;
    return (
        <>
            <TextField
                label={t('tasks.titleLabel')}
                hideLabel
                error={f.error && !d.title.trim() ? t('tasks.editor.titleRequired') : undefined}
                placeholder={t('tasks.titlePlaceholder')}
                value={d.title}
                maxLength={200}
                multiline
                editable={!f.busy}
                onChangeText={(title) => f.change({ title })}
                className="font-sans-bold text-[26px]"
                containerClassName="border-transparent bg-transparent px-0"
            />
            {d.kind === 'habit' && (
                <TextField
                    label={t('tasks.goal')}
                    placeholder={t('tasks.goalPlaceholder')}
                    value={d.goal}
                    maxLength={200}
                    editable={!f.busy}
                    onChangeText={(goal) => f.change({ goal })}
                />
            )}
            <TextField
                label={t('tasks.description')}
                value={d.description}
                maxLength={4000}
                multiline
                editable={!f.busy}
                onChangeText={(description) => f.change({ description })}
            />
        </>
    );
}
