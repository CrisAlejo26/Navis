import { isMinistry, type Meeting, type MeetingSlot, type Preacher } from '@navis/shared';
import { useCreateBeliever, usePreachers } from '@navis/api-client';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PreacherRow } from '@/components/calendar/preacher-row';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import type { DateRange } from '@/lib/calendar/view-range';
import { cn } from '@/lib/cn';

export interface PickTarget {
  date: string;
  meeting: Meeting;
  slot: MeetingSlot;
}

/**
 * Asignar en dos toques: se toca la fase y se elige a quién.
 *
 * La lista **no va en orden alfabético**: la encabeza quien lleva más tiempo
 * sin subir, que es la pregunta que se está haciendo quien programa. Y si la
 * persona no está todavía en la lista, se da de alta aquí mismo: mandar a otra
 * pantalla es la forma segura de que se vuelva a la hoja de cálculo.
 */
export function PreacherPicker({
  target,
  range,
  calendarId,
  ministry,
  onClose,
  onAssign,
  congregationName,
}: {
  target: PickTarget | null;
  range: DateRange;
  calendarId: string;
  /** El ministerio del calendario: es a quien se propone primero (D16). */
  ministry: string | null;
  onClose: () => void;
  onAssign: (believerId: string | null, name: string | null) => void;
  congregationName: (id: string | null) => string | undefined;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [all, setAll] = useState(false);

  const { data: preachers = [] } = usePreachers(
    api,
    { ...range, calendarId, q, all },
    Boolean(target),
  );
  const createBeliever = useCreateBeliever(api);

  const addPerson = async () => {
    const [firstName = q, ...rest] = q.trim().split(/\s+/);
    const person = await createBeliever.mutateAsync({
      firstName,
      lastName: rest.join(' '),
      // Se da de alta ya con el ministerio del calendario: quien se añade
      // desde el de sonido es de sonido.
      ministries: ministry && isMinistry(ministry) ? [ministry] : [],
      congregationId: target?.meeting.congregationId ?? null,
    });

    onAssign(person.id, `${person.firstName} ${person.lastName}`.trim());
  };

  return (
    <Dialog
      open={Boolean(target)}
      onClose={onClose}
      title={target ? target.slot.name : t('calendar.assign')}
      description={target ? `${target.meeting.name} · ${target.meeting.startTime}` : undefined}
    >
      <div className="gap-3 flex flex-col">
        <div className="gap-2 flex items-center">
          <SearchField
            value={q}
            onChange={setQ}
            label={t('calendar.searchPerson')}
            className="flex-1"
          />
          <button
            type="button"
            aria-pressed={all}
            onClick={() => {
              setAll(!all);
            }}
            className={cn(
              'h-10 px-3 text-xs font-medium shrink-0 cursor-pointer rounded-lg border',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              all ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(all ? 'calendar.everyone' : 'calendar.onlyMinistry')}
          </button>
        </div>

        <ul className="max-h-72 -mx-1 flex flex-col overflow-y-auto">
          {preachers.map((preacher: Preacher) => (
            <PreacherRow
              key={preacher.id}
              preacher={preacher}
              selected={preacher.id === target?.slot.believer?.id}
              congregationName={congregationName(preacher.congregationId)}
              onPick={(chosen) => {
                onAssign(chosen.id, chosen.name);
              }}
            />
          ))}
        </ul>

        <div className="gap-2 pt-3 flex flex-wrap items-center justify-between border-t">
          {q.trim().length > 1 && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={createBeliever.isPending}
              onClick={() => void addPerson()}
            >
              <UserPlus size={15} aria-hidden />
              {t('believers.addPerson')}: {q.trim()}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              onAssign(null, null);
            }}
          >
            {t('calendar.clearSlot')}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
