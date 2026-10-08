import type { LocalTable } from './local-schema';

const base: LocalTable['columns'] = [
    { name: 'id', type: 'text', pk: true },
    { name: 'created_at', type: 'text' },
    { name: 'updated_at', type: 'text' },
    { name: 'deleted_at', type: 'text', nullable: true },
];
export const LOCAL_TASK_TABLES: LocalTable[] = [
    {
        name: 'habits',
        mirror: 'Habit',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'owner_id', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'goal', type: 'text', nullable: true },
            { name: 'description', type: 'text', nullable: true },
            { name: 'date', type: 'text' },
            { name: 'time', type: 'text', nullable: true },
            { name: 'status', type: 'text', nullable: true },
            { name: 'completed_at', type: 'text', nullable: true },
            { name: 'repeat_freq', type: 'text', default: 'ninguna' },
        ],
    },
    {
        name: 'habit_tags',
        mirror: 'HabitTag',
        columns: [...base, { name: 'habit_id', type: 'text' }, { name: 'tag_id', type: 'text' }],
    },
    {
        name: 'habit_occurrences',
        mirror: 'HabitOccurrence',
        columns: [
            ...base,
            { name: 'habit_id', type: 'text' },
            { name: 'date', type: 'text' },
            { name: 'status', type: 'text' },
            { name: 'completed_at', type: 'text', nullable: true },
        ],
    },
    ...(['task', 'habit'] as const).flatMap((kind): LocalTable[] => [
        {
            name: `${kind}_reminders`,
            mirror: kind === 'task' ? 'TaskReminder' : 'HabitReminder',
            columns: [
                ...base,
                { name: `${kind}_id`, type: 'text' },
                { name: 'enabled', type: 'bool', default: true },
                { name: 'remind_at', type: 'text' },
            ],
        },
        {
            name: `${kind}_reminder_tags`,
            mirror: kind === 'task' ? 'TaskReminderTag' : 'HabitReminderTag',
            columns: [
                ...base,
                { name: 'reminder_id', type: 'text' },
                { name: 'tag_id', type: 'text' },
            ],
        },
    ]),
    {
        name: 'task_time_entries',
        mirror: 'TaskTimeEntry',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'owner_id', type: 'text' },
            { name: 'task_id', type: 'text' },
            { name: 'started_at', type: 'text' },
            { name: 'ended_at', type: 'text', nullable: true },
        ],
    },
    {
        name: 'task_streak_cache',
        mirror: 'TaskStreakCache',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'owner_id', type: 'text' },
            { name: 'longest_streak', type: 'int', default: 0 },
        ],
    },
];
