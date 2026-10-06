import { TaskTodayScreen } from '@/components/tasks/task-today-screen';
import { useListContext } from '@/hooks/use-lists';

export default function TasksScreen() {
    const { context } = useListContext();
    return <TaskTodayScreen key={`${context.churchId}:${context.userId}`} />;
}
