import { TaskOrderScreen } from '@/components/tasks/task-order-screen';
import { useListContext } from '@/hooks/use-lists';
export default function OrderScreen() {
    const { context } = useListContext();
    return <TaskOrderScreen key={`${context.churchId}:${context.userId}`} />;
}
