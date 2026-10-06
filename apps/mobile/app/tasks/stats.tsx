import { TaskStatisticsScreen } from '@/components/tasks/task-statistics-screen';
import { useListContext } from '@/hooks/use-lists';
export default function TasksStatsScreen() {
    const { context } = useListContext();
    return <TaskStatisticsScreen key={`${context.churchId}:${context.userId}`} />;
}
