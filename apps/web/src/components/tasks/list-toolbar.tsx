import { useTags } from '@navis/api-client';
import { TASK_SORTS, type TaskSort } from '@navis/shared';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TagChip } from '@/components/tasks/tag-chip';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { DateQuick, GroupBy, ListType, useListScreen } from '@/lib/tasks/use-list-screen';

const TYPE_OPTIONS: { key: ListType; labelKey: string }[] = [
  { key: 'both', labelKey: 'tasks.filterBoth' },
  { key: 'tasks', labelKey: 'tasks.tasksTab' },
  { key: 'habits', labelKey: 'tasks.habitsTab' },
];

const DATE_OPTIONS: { key: DateQuick; labelKey: string }[] = [
  { key: 'today', labelKey: 'tasks.filterToday' },
  { key: 'tomorrow', labelKey: 'tasks.filterTomorrow' },
  { key: 'week', labelKey: 'tasks.filterThisWeek' },
  { key: 'month', labelKey: 'tasks.filterThisMonth' },
  { key: 'overdue', labelKey: 'tasks.filterOverdue' },
];

const SORT_KEY: Record<TaskSort, string> = {
  nearest: 'tasks.sortNearest',
  farthest: 'tasks.sortFarthest',
  priority: 'tasks.sortPriority',
  recent: 'tasks.sortRecent',
  alphabetical: 'tasks.sortAlphabetical',
};

const GROUP_KEY: Record<GroupBy, string> = {
  none: 'tasks.groupNone',
  status: 'tasks.groupStatus',
  date: 'tasks.groupDate',
  tag: 'tasks.groupTag',
  priority: 'tasks.groupPriority',
};

const GROUP_OPTIONS: GroupBy[] = ['none', 'status', 'date', 'tag', 'priority'];

/** La barra de filtros del Listado (RFC 0018 §9.5): todo en la URL. */
export function ListToolbar({ screen }: { screen: ReturnType<typeof useListScreen> }) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags(api);

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-2 flex flex-wrap items-center">
        <label className="relative min-w-[10rem] flex-1">
          <span className="sr-only">{t('tasks.filterSearch')}</span>
          <Search
            size={14}
            aria-hidden
            className="left-3 absolute top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={screen.search}
            onChange={(event) => {
              screen.setSearch(event.target.value);
            }}
            placeholder={t('tasks.filterSearch')}
            className="h-9 pl-8 pr-3 text-sm w-full rounded-lg border bg-card outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
          />
        </label>

        <Select
          size="sm"
          value={screen.sort}
          aria-label={t('tasks.sortBy')}
          onChange={(event) => {
            screen.setSort(event.target.value as TaskSort);
          }}
        >
          {TASK_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {t(SORT_KEY[sort])}
            </option>
          ))}
        </Select>

        <Select
          size="sm"
          value={screen.group}
          aria-label={t('tasks.groupBy')}
          onChange={(event) => {
            screen.setGroup(event.target.value as GroupBy);
          }}
        >
          {GROUP_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {t(GROUP_KEY[option])}
            </option>
          ))}
        </Select>

        <button
          type="button"
          onClick={() => {
            screen.setHideCompleted(!screen.hideCompleted);
          }}
          aria-pressed={screen.hideCompleted}
          className={cn(
            'px-3 h-9 text-xs font-medium cursor-pointer rounded-full border transition-colors',
            screen.hideCompleted
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted',
          )}
        >
          {t('tasks.hideCompleted')}
        </button>
      </div>

      <div className="gap-1.5 flex flex-wrap">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              screen.setType(option.key);
            }}
            aria-pressed={screen.type === option.key}
            className={cn(
              'px-3 h-7 text-xs font-medium cursor-pointer rounded-full border transition-colors',
              screen.type === option.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}

        <span aria-hidden className="mx-1 w-px self-stretch bg-border" />

        {DATE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => {
              screen.setDateQuick(screen.dateQuick === option.key ? 'custom' : option.key);
            }}
            aria-pressed={screen.dateQuick === option.key}
            className={cn(
              'px-3 h-7 text-xs font-medium cursor-pointer rounded-full border transition-colors',
              screen.dateQuick === option.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted',
            )}
          >
            {t(option.labelKey)}
          </button>
        ))}
      </div>

      {tags.length > 0 && (
        <div className="gap-1.5 flex flex-wrap">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => {
                screen.toggleTag(tag.id);
              }}
              aria-pressed={screen.tag.includes(tag.id)}
              className={cn(
                'rounded-full transition-opacity',
                !screen.tag.includes(tag.id) && 'opacity-45 hover:opacity-80',
              )}
            >
              <TagChip tag={tag} size="sm" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
