import { useBelievers } from '@navis/api-client';
import { believerName } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/**
 * El buscador de siempre, para elegir de quién es el acceso (RFC 0010 D20).
 *
 * Enseña foto y sede porque en una iglesia hay tres Juanes, y elegir a la
 * persona rellena la etiqueta y propone el usuario: es lo que convierte «alguien
 * entró ayer a las 21:14» en «**Juan Pérez** entró ayer a las 21:14».
 */
/** Lo mínimo para elegir a alguien: vale la fila del listado y vale la ficha. */
export interface PickableBeliever {
  id: string;
  firstName: string;
  lastName: string;
  hasPhoto: boolean;
}

export function ViewerBelieverPicker({
  value,
  onPick,
}: {
  value: PickableBeliever | null;
  onPick: (believer: PickableBeliever) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const { data: page } = useBelievers(api, { search: q || undefined, limit: 20 }, q.length > 1);

  return (
    <div className="gap-2 flex flex-col">
      <SearchField value={q} onChange={setQ} label={t('lists.searchPerson')} />

      {q.length > 1 && (
        <ul className="max-h-48 overflow-y-auto rounded-lg border">
          {page?.items.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => {
                  onPick(person);
                }}
                aria-pressed={person.id === value?.id}
                className={cn(
                  'px-3 py-2 gap-2.5 text-sm flex w-full cursor-pointer items-center text-left',
                  'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
                  person.id === value?.id && 'bg-primary/10',
                )}
              >
                <BelieverPhoto believer={person} />
                <span className="truncate">{believerName(person)}</span>
              </button>
            </li>
          ))}

          {page?.items.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{t('believers.noResults')}</li>
          )}
        </ul>
      )}

      {value && (
        <p className="text-xs text-muted-foreground">
          {t('lists.pickedPerson', { name: believerName(value) })}
        </p>
      )}
    </div>
  );
}
