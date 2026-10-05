import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TASK_PRIORITIES } from '@navis/shared';
import { Chip } from '@/components/ui/chip';
import { ActivityBlock } from './activity-block';
import { ActivityStatePicker } from './activity-state-picker';
import { priorityKeys } from './task-theme';
import type { useActivityEditor } from './use-activity-editor';
export function ActivityEditorState({ state: f }: { state: ReturnType<typeof useActivityEditor> }) {
    const { t } = useTranslation(),
        d = f.draft;
    return (
        <>
            <ActivityBlock title={t('tasks.status')}>
                {d.kind === 'task' && (
                    <View className="gap-2">
                        <Text className="font-sans-medium text-sm text-foreground">
                            {t('tasks.priority')}
                        </Text>
                        <View className="gap-2 flex-row flex-wrap">
                            {TASK_PRIORITIES.map((priority) => (
                                <Chip
                                    key={priority}
                                    label={t(priorityKeys[priority])}
                                    selected={priority === d.priority}
                                    disabled={f.busy}
                                    onPress={() => f.change({ priority })}
                                />
                            ))}
                        </View>
                    </View>
                )}
                <ActivityStatePicker
                    kind={d.kind}
                    value={d.status}
                    disabled={f.busy}
                    onChange={(status) => f.change({ status })}
                />
            </ActivityBlock>
        </>
    );
}
