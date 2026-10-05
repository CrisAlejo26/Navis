import { ActivityDetailHeader } from './activity-detail-header';
import { ActivityDetailContent } from './activity-detail-content';
import { ActivityDetailActions } from './activity-detail-actions';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppBar } from '@/components/ui/app-bar';
import { ActivityBlock } from './activity-block';
import { ActivityStatePicker } from './activity-state-picker';
import { ActivityQueryState } from './activity-query-state';
import { useActivityDetailScreen } from './use-activity-detail-screen';
import type { ItemKind } from '@/lib/tasks/editor-draft';
export function ActivityDetailScreen({
    kind,
    id,
    day,
}: {
    kind: ItemKind;
    id: string;
    day?: string;
}) {
    const d = useActivityDetailScreen(kind, id, day),
        { t } = useTranslation(),
        insets = useSafeAreaInsets();
    const title = t(kind === 'task' ? 'tasks.tasksTab' : 'tasks.habitsTab');
    if (!d.query.data)
        return (
            <ActivityQueryState
                title={title}
                pending={d.query.isPending}
                error={d.query.isError}
                onRetry={() => void d.query.refetch()}
            />
        );
    const { item, template } = d.query.data,
        timezone = d.query.scope.church?.timezone ?? 'UTC';
    return (
        <View className="flex-1 bg-background">
            <AppBar title={title} />
            <ScrollView
                contentContainerStyle={{
                    padding: 22,
                    paddingBottom: insets.bottom + 24,
                    gap: 16,
                    maxWidth: 480,
                    width: '100%',
                    alignSelf: 'center',
                }}
            >
                <ActivityDetailHeader item={item} />
                <ActivityBlock title={t('tasks.status')}>
                    <ActivityStatePicker
                        kind={kind}
                        value={item.status}
                        disabled={d.busy}
                        onChange={(status) => void d.change(status)}
                    />
                </ActivityBlock>
                <ActivityDetailContent item={item} template={template} timezone={timezone} />
                <ActivityDetailActions state={d} item={item} />
            </ScrollView>
        </View>
    );
}
