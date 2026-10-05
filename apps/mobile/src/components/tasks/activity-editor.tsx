import { ActivityEditorText } from './activity-editor-text';
import { ActivityEditorState } from './activity-editor-state';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { type Task, type Habit, type TaskStatus } from '@navis/shared';
import { RowEditorFrame } from '@/components/tables/row-editor-frame';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useActivityEditor } from './use-activity-editor';
import { ActivityBlock } from './activity-block';
import { ActivityScheduleFields } from './activity-schedule-fields';
import { ActivityReminderFields } from './activity-reminder-fields';
import { TaskTagPicker } from './task-tag-picker';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function ActivityEditor({
    kind,
    previous,
    day,
    status,
}: {
    kind: ItemKind;
    previous?: Task | Habit;
    day?: string;
    status?: TaskStatus;
}) {
    const f = useActivityEditor(kind, previous, day, status),
        { t } = useTranslation(),
        d = f.draft;
    return (
        <RowEditorFrame
            title={t(previous ? 'tasks.edit' : d.kind === 'task' ? 'tasks.add' : 'tasks.addHabit')}
            dirty={f.dirty || f.busy}
            onClose={() => router.back()}
            contentPadding={22}
            contentWidth={480}
            footer={
                <>
                    {f.error && <FieldError message={t(f.error)} />}
                    <Button
                        title={t('common.save')}
                        className="rounded-2xl"
                        loading={f.busy}
                        onPress={() => void f.save()}
                    />
                </>
            }
        >
            {!previous && (
                <SegmentedControl
                    value={d.kind}
                    onChange={(kind) =>
                        f.change({
                            kind,
                            status: 'pendiente',
                            repeatFreq: kind === 'habit' ? 'diaria' : 'ninguna',
                        })
                    }
                    options={[
                        { value: 'task', label: t('tasks.tasksTab') },
                        { value: 'habit', label: t('tasks.habitsTab') },
                    ]}
                />
            )}
            <ActivityEditorText state={f} />
            <ActivityBlock title={t('tasks.date')}>
                <ActivityScheduleFields
                    draft={d}
                    change={f.change}
                    timezone={f.timezone}
                    busy={f.busy}
                />
            </ActivityBlock>
            <ActivityEditorState state={f} />
            <ActivityBlock title={t('tasks.tags')}>
                <TaskTagPicker
                    value={d.tagIds}
                    disabled={f.busy}
                    onChange={(tagIds) => f.change({ tagIds })}
                />
            </ActivityBlock>
            <ActivityBlock title={t('tasks.reminder')}>
                <ActivityReminderFields
                    draft={d}
                    change={f.change}
                    timezone={f.timezone}
                    busy={f.busy}
                />
            </ActivityBlock>
        </RowEditorFrame>
    );
}
