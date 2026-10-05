import { useLocalSearchParams } from 'expo-router';
import { ActivityEditScreen } from '@/components/tasks/activity-edit-screen';
export default function EditActivityRoute() {
    const { kind, id, date } = useLocalSearchParams<{
        kind?: string;
        id?: string;
        date?: string;
    }>();
    return <ActivityEditScreen kind={kind === 'habit' ? 'habit' : 'task'} id={id} day={date} />;
}
