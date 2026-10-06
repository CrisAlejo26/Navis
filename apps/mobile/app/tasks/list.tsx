import { TaskDirectory } from '@/components/tasks/task-directory';
import { useListContext } from '@/hooks/use-lists';
export default function TasksListScreen() {
    const { context } = useListContext();
    return <TaskDirectory key={`${context.churchId}:${context.userId}`} />;
}
