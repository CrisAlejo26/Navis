import { Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Las fases de una reunión, en orden y editables.
 *
 * Son **texto de cada iglesia** (D6): aquí no hay una lista cerrada de fases
 * que traducir a seis idiomas, sino lo que cada congregación llame a lo suyo.
 */
export function PhaseFields({
  phases,
  onChange,
}: {
  phases: readonly string[];
  onChange: (phases: string[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('calendar.phases')}</legend>

      {phases.map((phase, index) => (
        <div key={index} className="gap-2 flex items-center">
          <Input
            value={phase}
            aria-label={t('calendar.phaseName')}
            onChange={(event) => {
              onChange(phases.map((one, i) => (i === index ? event.target.value : one)));
            }}
            className="flex-1"
          />
          {phases.length > 1 && (
            <button
              type="button"
              aria-label={t('common.delete')}
              onClick={() => {
                onChange(phases.filter((_one, i) => i !== index));
              }}
              className="h-9 w-9 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X size={15} aria-hidden />
            </button>
          )}
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => {
          onChange([...phases, '']);
        }}
      >
        <Plus size={14} aria-hidden />
        {t('calendar.addPhase')}
      </Button>
    </fieldset>
  );
}
