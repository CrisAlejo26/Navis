import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { formatDay, formatMoment } from '@/lib/format';
import { activityKind, type ActivityItem } from '@/lib/tasks/filters';
import type { TaskStatus } from '@navis/shared';
import { statusKeys } from './task-theme';

export function TaskActions({
    item,
    busy,
    onClose,
    onStatus,
    onDelete,
}: {
    item: ActivityItem;
    busy: boolean;
    onClose: () => void;
    onStatus: (status: TaskStatus) => void;
    onDelete: () => void;
}) {
    const { t } = useTranslation();
    return (
        <BottomSheet visible onClose={onClose} title={item.title}>
            <View className="gap-3 pb-2">
                <Text className="font-sans text-muted-foreground">
                    {formatDay(item.date)}
                    {item.time ? ` · ${item.time}` : ''}
                </Text>
                {item.description && (
                    <Text className="font-sans text-foreground">{item.description}</Text>
                )}
                {item.reminder?.enabled && (
                    <Text className="font-sans text-muted-foreground">
                        {t('tasks.reminder')}: {formatMoment(item.reminder.remindAt)}
                    </Text>
                )}
                {(['pendiente', 'en_progreso', 'completada'] as const)
                    .filter((status) => activityKind(item) === 'task' || status !== 'en_progreso')
                    .map((status) => (
                        <Button
                            key={status}
                            title={t(statusKeys[status])}
                            variant={item.status === status ? 'primary' : 'secondary'}
                            disabled={busy || item.status === status}
                            onPress={() => onStatus(status)}
                        />
                    ))}
                <Button
                    title={t('tasks.delete')}
                    variant="destructive"
                    leadingIcon="trash-outline"
                    disabled={busy}
                    onPress={onDelete}
                />
            </View>
        </BottomSheet>
    );
}
