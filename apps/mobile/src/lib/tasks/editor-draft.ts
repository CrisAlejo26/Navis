import {
    createTaskSchema,
    createHabitSchema,
    type Task,
    type Habit,
    type TaskStatus,
    type TaskPriority,
    type HabitRepeatFreq,
} from '@navis/shared';
import { reminderInstant, reminderParts } from './reminder-time';
export type ItemKind = 'task' | 'habit';
export interface ActivityDraft {
    kind: ItemKind;
    title: string;
    description: string;
    goal: string;
    date: string;
    time: string;
    allDay: boolean;
    priority: TaskPriority;
    status: TaskStatus;
    repeatFreq: HabitRepeatFreq;
    tagIds: string[];
    reminderEnabled: boolean;
    reminderDate: string;
    reminderTime: string;
    reminderTagIds: string[];
}
export function activityDraft(
    kind: ItemKind,
    today: string,
    timezone: string,
    item?: Task | Habit,
    status?: TaskStatus,
): ActivityDraft {
    const reminder = item?.reminder
        ? reminderParts(item.reminder.remindAt, timezone)
        : { date: item?.date ?? today, time: item?.time ?? '09:00' };
    return {
        kind,
        title: item?.title ?? '',
        description: item?.description ?? '',
        goal: item && 'goal' in item ? (item.goal ?? '') : '',
        date: item?.date ?? today,
        time: item?.time ?? '09:00',
        allDay: !item?.time,
        priority: item && 'priority' in item ? item.priority : 'media',
        status: status ?? item?.status ?? 'pendiente',
        repeatFreq: item?.repeatFreq ?? (kind === 'habit' ? 'diaria' : 'ninguna'),
        tagIds: item?.tags.map((tag) => tag.id) ?? [],
        reminderEnabled: item?.reminder?.enabled ?? false,
        reminderDate: reminder.date,
        reminderTime: reminder.time,
        reminderTagIds: item?.reminder?.tags.map((tag) => tag.id) ?? [],
    };
}
export function draftInput(draft: ActivityDraft, timezone: string, previous?: Task | Habit) {
    const common = {
        title: draft.title,
        description: draft.description,
        date: draft.date,
        time: draft.allDay ? null : draft.time,
        tagIds: draft.tagIds,
        reminderEnabled: draft.reminderEnabled,
        reminderAt: draft.reminderEnabled
            ? reminderInstant(draft.reminderDate, draft.reminderTime, timezone)
            : undefined,
        reminderTagIds: draft.reminderTagIds,
    };
    return draft.kind === 'habit'
        ? {
              kind: 'habit' as const,
              input: createHabitSchema.parse({
                  ...common,
                  goal: draft.goal,
                  repeatFreq: draft.repeatFreq,
              }),
          }
        : {
              kind: 'task' as const,
              input: createTaskSchema.parse({
                  ...common,
                  priority: draft.priority,
                  isRecurring: draft.repeatFreq !== 'ninguna',
                  repeatFreq: draft.repeatFreq === 'ninguna' ? undefined : draft.repeatFreq,
                  repeatInterval:
                      previous && 'repeatInterval' in previous ? previous.repeatInterval : 1,
                  repeatEndType:
                      previous && 'repeatEndType' in previous
                          ? (previous.repeatEndType ?? undefined)
                          : undefined,
                  repeatEndDate:
                      previous && 'repeatEndDate' in previous
                          ? (previous.repeatEndDate ?? undefined)
                          : undefined,
                  repeatEndCount:
                      previous && 'repeatEndCount' in previous
                          ? (previous.repeatEndCount ?? undefined)
                          : undefined,
              }),
          };
}
