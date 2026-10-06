import { TaskSeriesScreen } from '@/components/tasks/task-series-screen';
import { useListContext } from '@/hooks/use-lists';
export default function SeriesScreen() { const { context } = useListContext(); return <TaskSeriesScreen key={`${context.churchId}:${context.userId}`} />; }
