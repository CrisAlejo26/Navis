import { useLocalSearchParams } from 'expo-router';
import { ActivityDetailScreen } from '@/components/tasks/activity-detail-screen';
export default function ActivityDetailRoute() {
    const {
        kind,
        id = '',
        date,
    } = useLocalSearchParams<{ kind?: string; id?: string; date?: string }>();
    return <ActivityDetailScreen kind={kind === 'habit' ? 'habit' : 'task'} id={id} day={date} />;
}
