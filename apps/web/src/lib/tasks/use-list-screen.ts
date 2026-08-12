import { useHabits, useTasks } from '@navis/api-client';
import {
  DEFAULT_TASK_SORT,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  todayIn,
  type HabitOccurrence,
  type TaskOccurrence,
  type TaskSort,
} from '@navis/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { api } from '@/lib/api';

export type ListType = 'tasks' | 'habits' | 'both';
export type ListView = 'calendar' | 'list';
export type DateQuick = 'custom' | 'today' | 'tomorrow' | 'week' | 'month' | 'overdue';
export type GroupBy = 'none' | 'status' | 'date' | 'tag' | 'priority';

export type ListItem =
  { kind: 'task'; occurrence: TaskOccurrence } | { kind: 'habit'; occurrence: HabitOccurrence };

/** Lo que comparten una tarea y un hábito, para pintar una fila sin mirar el tipo. */
export function itemFields(item: ListItem) {
  return {
    id: item.kind === 'task' ? item.occurrence.taskId : item.occurrence.habitId,
    title: item.occurrence.title,
    date: item.occurrence.date,
    time: item.occurrence.time,
    tags: item.occurrence.tags,
    status: item.occurrence.status,
    priority: item.kind === 'task' ? item.occurrence.priority : null,
  };
}

/**
 * Todo lo del Listado (RFC 0018 §9.5): filtros, tipo y vista, siempre en la
 * URL (un solo sitio de verdad, como `useCalendarParams`).
 */
export function useListScreen() {
  const [params, setParams] = useSearchParams();
  const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const update = useCallback(
    (changes: Record<string, string | string[] | null>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(changes)) {
            next.delete(key);
            if (Array.isArray(value)) for (const one of value) next.append(key, one);
            else if (value !== null && value !== '') next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const view: ListView = params.get('view') === 'calendar' ? 'calendar' : 'list';
  const type: ListType = (params.get('type') as ListType | null) ?? 'both';
  const search = params.get('search') ?? '';
  const tagKey = params.getAll('tag').join(',');
  const tag = useMemo(() => (tagKey ? tagKey.split(',') : []), [tagKey]);
  const reminder = (params.get('reminder') as 'with' | 'without' | null) ?? undefined;
  const hideCompleted = params.get('hideCompleted') !== 'false';
  const sort = (params.get('sort') as TaskSort | null) ?? DEFAULT_TASK_SORT;
  const dateQuick: DateQuick = (params.get('date') as DateQuick | null) ?? 'custom';
  const customFrom = params.get('from') ?? '';
  const customTo = params.get('to') ?? '';
  const group: GroupBy = (params.get('group') as GroupBy | null) ?? 'none';

  const range = useMemo(
    () => rangeFor(dateQuick, today, customFrom, customTo),
    [dateQuick, today, customFrom, customTo],
  );

  const tasksQuery = useTasks(
    api,
    {
      from: range.from,
      to: range.to,
      search: search || undefined,
      tag,
      reminder,
      hideCompleted,
      sort,
      limit: 200,
    },
    type !== 'habits',
  );
  const habitsQuery = useHabits(
    api,
    {
      from: range.from,
      to: range.to,
      search: search || undefined,
      tag,
      reminder,
      hideCompleted,
      limit: 200,
    },
    type !== 'tasks',
  );

  const items: ListItem[] = useMemo(() => {
    const tasks: ListItem[] = (type === 'habits' ? [] : (tasksQuery.data?.items ?? [])).map(
      (occurrence) => ({
        kind: 'task',
        occurrence,
      }),
    );
    const habits: ListItem[] = (type === 'tasks' ? [] : (habitsQuery.data?.items ?? [])).map(
      (occurrence) => ({
        kind: 'habit',
        occurrence,
      }),
    );
    return applyOverdue([...tasks, ...habits], dateQuick, today);
  }, [tasksQuery.data, habitsQuery.data, type, dateQuick, today]);

  return {
    view,
    type,
    search,
    tag,
    reminder,
    hideCompleted,
    sort,
    dateQuick,
    group,
    range,
    items,
    isLoading: tasksQuery.isLoading || habitsQuery.isLoading,
    setView: (next: ListView) => {
      update({ view: next });
    },
    setType: (next: ListType) => {
      update({ type: next === 'both' ? null : next });
    },
    setSearch: (next: string) => {
      update({ search: next || null });
    },
    setDateQuick: (next: DateQuick) => {
      update({ date: next === 'custom' ? null : next });
    },
    setCustomRange: (from: string, to: string) => {
      update({ date: 'custom', from, to });
    },
    toggleTag: (id: string) => {
      update({ tag: tag.includes(id) ? tag.filter((one) => one !== id) : [...tag, id] });
    },
    setReminder: (next: 'with' | 'without' | null) => {
      update({ reminder: next });
    },
    setHideCompleted: (next: boolean) => {
      update({ hideCompleted: next ? null : 'false' });
    },
    setSort: (next: TaskSort) => {
      update({ sort: next === DEFAULT_TASK_SORT ? null : next });
    },
    setGroup: (next: GroupBy) => {
      update({ group: next === 'none' ? null : next });
    },
    clear: () => {
      update({
        search: null,
        tag: [],
        reminder: null,
        hideCompleted: null,
        sort: null,
        group: null,
        date: null,
        from: null,
        to: null,
      });
    },
    activeCount:
      (search ? 1 : 0) + tag.length + (reminder ? 1 : 0) + (dateQuick !== 'custom' ? 1 : 0),
  };
}

function rangeFor(quick: DateQuick, today: string, customFrom: string, customTo: string) {
  switch (quick) {
    case 'today':
      return { from: today, to: today };
    case 'tomorrow': {
      const tomorrow = shift(today, 1);
      return { from: tomorrow, to: tomorrow };
    }
    case 'week':
      return { from: startOfWeek(today), to: endOfWeek(today) };
    case 'month':
      return { from: startOfMonth(today), to: endOfMonth(today) };
    case 'overdue':
      return { from: shift(today, -92), to: shift(today, -1) };
    case 'custom':
    default:
      return customFrom && customTo
        ? { from: customFrom, to: customTo }
        : { from: today, to: shift(today, 30) };
  }
}

function shift(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export interface ItemGroup {
  key: string;
  labelKey?: string;
  label?: string;
  items: ListItem[];
}

const STATUS_ORDER = ['pendiente', 'en_progreso', 'completada'];
const PRIORITY_ORDER = ['alta', 'media', 'baja'];

/** Agrupa el listado por §9.5 «Agrupar por». `none` devuelve un único grupo. */
export function groupItems(items: ListItem[], group: GroupBy): ItemGroup[] {
  if (group === 'none') return [{ key: 'all', items }];

  const buckets = new Map<string, ListItem[]>();
  const tagNames = new Map<string, string>();

  for (const item of items) {
    const fields = itemFields(item);

    if (group === 'tag') {
      const tags =
        fields.tags.length > 0 ? fields.tags : [{ id: 'sin-etiqueta', name: 'sin-etiqueta' }];
      for (const tag of tags) {
        tagNames.set(tag.id, tag.name);
        buckets.set(tag.id, [...(buckets.get(tag.id) ?? []), item]);
      }
      continue;
    }

    const key =
      group === 'status'
        ? fields.status
        : group === 'priority'
          ? (fields.priority ?? 'sin-prioridad')
          : fields.date;
    buckets.set(key, [...(buckets.get(key) ?? []), item]);
  }

  const order = group === 'status' ? STATUS_ORDER : group === 'priority' ? PRIORITY_ORDER : null;
  const keys = order ? order.filter((key) => buckets.has(key)) : [...buckets.keys()].sort();

  return keys.map((key) => {
    const bucket = buckets.get(key) ?? [];
    if (group === 'tag') return { key, label: tagNames.get(key) ?? key, items: bucket };
    if (group === 'status') return { key, labelKey: STATUS_LABEL_KEY[key], items: bucket };
    if (group === 'priority') {
      return {
        key,
        labelKey: key === 'sin-prioridad' ? undefined : PRIORITY_LABEL_KEY[key],
        items: bucket,
      };
    }
    return { key, label: key, items: bucket };
  });
}

const STATUS_LABEL_KEY: Record<string, string> = {
  pendiente: 'tasks.statusPending',
  en_progreso: 'tasks.statusInProgress',
  completada: 'tasks.statusDone',
};

const PRIORITY_LABEL_KEY: Record<string, string> = {
  baja: 'tasks.priorityLow',
  media: 'tasks.priorityMedium',
  alta: 'tasks.priorityHigh',
};

function applyOverdue(items: ListItem[], quick: DateQuick, today: string): ListItem[] {
  if (quick !== 'overdue') return items;
  return items.filter(
    (item) => item.occurrence.date < today && item.occurrence.status !== 'completada',
  );
}
