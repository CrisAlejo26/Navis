import { DASHBOARD_TASKS_PREVIEW, type DashboardTask } from '@navis/shared';
import { readActivities } from './activities-repo';
import { taskStreak } from './tasks-reads';
import { defaultFilters } from '@/lib/tasks/filters';

export async function dashboardTasks(churchId: string, userId: string, today: string) {
    const context = { churchId, userId };
    const items = await readActivities(context, { ...defaultFilters(), type: 'task' }, today, {
        from: today,
        to: today,
    });
    const tasks: DashboardTask[] = items
        .flatMap((item) =>
            'taskId' in item
                ? [
                      {
                          taskId: item.taskId,
                          title: item.title,
                          time: item.time,
                          priority: item.priority,
                          completed: item.status === 'completada',
                          accent: item.tags[0]?.accent ?? 'primary',
                      },
                  ]
                : [],
        )
        .slice(0, DASHBOARD_TASKS_PREVIEW);
    return { tasks, streak: (await taskStreak(context, today)).current };
}
