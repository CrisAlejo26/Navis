import { useLocalSearchParams } from 'expo-router';
import { ListScreen } from '@/components/lists/list-screen';
import { useListContext } from '@/hooks/use-lists';
export default function ListRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { context } = useListContext();
    return <ListScreen key={`${context.churchId}:${id}`} id={id} />;
}
