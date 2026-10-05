import { useLocalSearchParams } from 'expo-router';
import { TableRowScreen } from '@/components/tables/table-row-screen';
import { useTableContext } from '@/hooks/use-tables';
export default function TableRowRoute() {
    const { id, rowId, viewId, initial } = useLocalSearchParams<{
        id: string;
        rowId?: string;
        viewId?: string;
        initial?: string;
    }>();
    const { context } = useTableContext();
    return (
        <TableRowScreen
            key={`${context.churchId}:${context.userId}:${id}:${rowId ?? 'new'}`}
            id={id}
            rowId={rowId}
            viewId={viewId}
            initial={initial}
        />
    );
}
