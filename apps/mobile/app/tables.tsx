import { TablesDirectory } from '@/components/tables/tables-directory';
import { useTableContext } from '@/hooks/use-tables';
export default function TablesRoute() {
    const { context } = useTableContext();
    return <TablesDirectory key={`${context.churchId}:${context.userId}`} />;
}
