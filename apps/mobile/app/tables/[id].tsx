import { useLocalSearchParams } from 'expo-router';
import { TableScreen } from '@/components/tables/table-screen';
import { useTableContext } from '@/hooks/use-tables';
export default function TableRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { context } = useTableContext();
    return <TableScreen key={`${context.churchId}:${context.userId}:${id}`} id={id} />;
}
