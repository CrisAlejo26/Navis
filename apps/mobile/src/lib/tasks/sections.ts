import { activityKey, type ActivityItem, type TaskGroup } from './filters';
export interface ActivitySection {
    key: string;
    title: string;
    warn: boolean;
    data: ActivityItem[];
}
export function activitySections(
    items: ActivityItem[],
    group: TaskGroup,
    today: string,
): ActivitySection[] {
    const sections = new Map<string, ActivitySection>();
    for (const item of items) {
        const key =
            group === 'date'
                ? item.date < today && item.status !== 'completada'
                    ? 'overdue'
                    : item.date
                : group === 'status'
                  ? item.status
                  : group === 'priority'
                    ? 'priority' in item
                        ? item.priority
                        : 'habit'
                    : group === 'tag'
                      ? (item.tags[0]?.id ?? 'untagged')
                      : 'none';
        if (!sections.has(key))
            sections.set(key, {
                key,
                title: group === 'tag' ? (item.tags[0]?.name ?? '') : key,
                warn: key === 'overdue',
                data: [],
            });
        sections.get(key)?.data.push(item);
    }
    return [...sections.values()];
}
export { activityKey };
