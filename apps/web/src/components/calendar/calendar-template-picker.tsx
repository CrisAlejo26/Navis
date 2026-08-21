import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { useCalendarTemplates, type CalendarTemplateSlug } from '@/lib/calendar/templates';

/**
 * El punto de partida al crear un calendario (§ ampliación RFC 0002): en
 * blanco, o una de las plantillas ya rellenadas. Solo al crear — al
 * renombrar no tiene sentido, ya hay un calendario de verdad detrás.
 */
export function CalendarTemplatePicker({
  value,
  onChange,
}: {
  value: CalendarTemplateSlug | null;
  onChange: (slug: CalendarTemplateSlug | null) => void;
}) {
  const { t } = useTranslation();
  const templates = useCalendarTemplates();

  return (
    <fieldset className="gap-1.5 flex flex-col">
      <legend className="text-sm font-medium">{t('calendar.templateLabel')}</legend>
      <p className="text-xs text-muted-foreground">{t('calendar.templateHint')}</p>

      <div
        className="gap-2 mt-1 flex flex-wrap"
        role="radiogroup"
        aria-label={t('calendar.templateLabel')}
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === null}
          onClick={() => {
            onChange(null);
          }}
          className={cn(
            'px-3 py-1.5 text-sm cursor-pointer rounded-full border transition-colors duration-200',
            value === null
              ? 'border-primary bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {t('calendar.templateCustom')}
        </button>

        {templates.map((template) => (
          <button
            key={template.slug}
            type="button"
            role="radio"
            aria-checked={value === template.slug}
            onClick={() => {
              onChange(template.slug);
            }}
            className={cn(
              'px-3 py-1.5 text-sm cursor-pointer rounded-full border transition-colors duration-200',
              value === template.slug
                ? 'border-primary bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {template.name}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
