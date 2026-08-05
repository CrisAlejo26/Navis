import { useEmotions } from '@navis/api-client';
import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EmotionChip } from '@/components/dreams/emotion-chip';
import { EmotionsManager } from '@/components/dreams/emotions-manager';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * Qué se sintió en el sueño: se eligen **varias** (RFC 0005 D3).
 *
 * Pastillas y no un desplegable múltiple: con doce opciones de color, verlas
 * todas a la vez es más rápido que abrir una lista, y el color es justo lo que
 * ayuda a encontrar la que se busca.
 *
 * Lo elegido se marca con el color pleno **y** con `aria-pressed`: un botón que
 * solo cambiase de tono no diría nada a quien no lo distingue (Regla 3 §7).
 */
export function EmotionPicker({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (ids: string[]) => void;
}) {
  const { t } = useTranslation();
  const { data: emotions = [] } = useEmotions(api);
  const [managing, setManaging] = useState(false);

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{t('dreams.emotionsLabel')}</legend>
      <p className="text-xs text-muted-foreground">{t('dreams.emotionsHint')}</p>

      <div className="gap-1.5 flex flex-wrap">
        {emotions.map((emotion) => {
          const picked = value.includes(emotion.id);

          return (
            <button
              key={emotion.id}
              type="button"
              aria-pressed={picked}
              onClick={() => {
                onChange(picked ? value.filter((id) => id !== emotion.id) : [...value, emotion.id]);
              }}
              className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <EmotionChip
                emotion={emotion}
                className={cn(
                  'py-1 transition-colors',
                  picked
                    ? 'border-[var(--acento)] bg-[var(--acento)]/25'
                    : 'opacity-70 hover:opacity-100',
                )}
              />
            </button>
          );
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setManaging(true);
          }}
        >
          <Settings2 size={14} aria-hidden />
          {t('dreams.emotionsManage')}
        </Button>
      </div>

      {managing && (
        <EmotionsManager
          open
          onClose={() => {
            setManaging(false);
          }}
        />
      )}
    </fieldset>
  );
}
