import { useTags } from '@navis/api-client';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TagChip } from '@/components/tasks/tag-chip';
import { TagsManagerDialog } from '@/components/tasks/tags-manager-dialog';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/** Elegir qué etiquetas lleva una tarea o un hábito (RFC 0018 §5.1, §9.6). */
export function TagPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const { data: tags = [] } = useTags(api);
  const [managing, setManaging] = useState(false);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((one) => one !== id) : [...value, id]);
  };

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('tasks.tags')}</legend>

      <div className="gap-1.5 flex flex-wrap">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              toggle(tag.id);
            }}
            aria-pressed={value.includes(tag.id)}
            className={cn(
              'rounded-full transition-opacity',
              !value.includes(tag.id) && 'opacity-45 hover:opacity-80',
            )}
          >
            <TagChip tag={tag} />
          </button>
        ))}

        <button
          type="button"
          onClick={() => {
            setManaging(true);
          }}
          className="gap-1 px-2.5 py-1 text-xs font-medium flex cursor-pointer items-center rounded-full border border-dashed text-muted-foreground hover:border-primary hover:text-primary"
        >
          <Settings2 size={11} aria-hidden />
          {t('tasks.manageTags')}
        </button>
      </div>

      <TagsManagerDialog
        open={managing}
        onClose={() => {
          setManaging(false);
        }}
      />
    </fieldset>
  );
}
