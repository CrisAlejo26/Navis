import { TASK_ICON_CATEGORIES, taskIconsByCategory, type TaskIconCategory } from '@navis/shared';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { TASK_ICON_MAP, taskIconLabelKey } from '@/lib/tasks/icon-map';

const BY_CATEGORY = taskIconsByCategory();

/**
 * El catálogo de iconos, con buscador y categorías (RFC 0018 §7.1).
 *
 * El buscador filtra por la etiqueta ya traducida, no por la clave en inglés
 * sin traducir (§7.1): así «maleta» encuentra `briefcase` en español.
 */
export function IconPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (icon: string) => void;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<TaskIconCategory>('work');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return BY_CATEGORY[category];

    return TASK_ICON_CATEGORIES.flatMap((cat) => BY_CATEGORY[cat]).filter((entry) =>
      t(`tasks.icons.${taskIconLabelKey(entry.key)}`)
        .toLowerCase()
        .includes(query),
    );
  }, [search, category, t]);

  return (
    <div className="gap-3 min-w-0 flex flex-col">
      <label className="relative">
        <span className="sr-only">{t('tasks.searchIcons')}</span>
        <Search
          size={15}
          aria-hidden
          className="left-3 absolute top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
          placeholder={t('tasks.searchIcons')}
          className="h-10 pl-9 pr-3 text-sm w-full rounded-lg border bg-card outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35"
        />
      </label>

      {!search && (
        <div className="gap-1.5 -mx-1 px-1 pb-1 flex overflow-x-auto">
          {TASK_ICON_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
              }}
              aria-pressed={cat === category}
              className={cn(
                'px-3 h-8 text-xs font-medium shrink-0 cursor-pointer rounded-full border whitespace-nowrap transition-colors',
                cat === category
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {t(`tasks.icons.categories.${cat}`)}
            </button>
          ))}
        </div>
      )}

      <div
        role="listbox"
        aria-label={t('tasks.tagIcon')}
        className="gap-1.5 p-1 max-h-56 sm:grid-cols-8 grid grid-cols-6 overflow-y-auto"
      >
        {filtered.map((entry) => {
          const Icon = TASK_ICON_MAP[entry.key];
          const label = t(`tasks.icons.${taskIconLabelKey(entry.key)}`);
          const selected = entry.key === value;

          return (
            <button
              key={entry.key}
              type="button"
              role="option"
              aria-selected={selected}
              aria-label={label}
              title={label}
              onClick={() => {
                onChange(entry.key);
              }}
              className={cn(
                'h-10 w-10 flex cursor-pointer items-center justify-center rounded-lg border transition-colors',
                'focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
            >
              <Icon size={17} aria-hidden />
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p className="py-6 text-sm col-span-full text-center text-muted-foreground">
            {t('tasks.noIconResults')}
          </p>
        )}
      </div>
    </div>
  );
}
