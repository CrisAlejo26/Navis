import { isMinistry, type MeetingSlot, type Preacher } from '@navis/shared';
import { useCreateBeliever, usePreachers } from '@navis/api-client';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ChosenPeople } from '@/components/calendar/chosen-people';
import type { PickTarget } from '@/components/calendar/preacher-picker';
import { PreacherRow } from '@/components/calendar/preacher-row';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import type { DateRange } from '@/lib/calendar/view-range';
import { toast } from '@/lib/toast';

type SlotPerson = MeetingSlot['believers'][number];

/**
 * La lista **no va en orden alfabético**: la encabeza quien lleva más tiempo
 * sin subir, que es la pregunta que se está haciendo quien programa. Y si la
 * persona no está todavía en la lista, se da de alta aquí mismo: mandar a otra
 * pantalla es la forma segura de que se vuelva a la hoja de cálculo.
 *
 * **Por defecto se proponen todos**, no solo la labor del calendario: quien
 * asigna quiere ver a la persona que piensa, y el filtro de la labor se queda
 * como alternativa. Y se carga por tandas —de veinticinco en veinticinco, con
 * «Ver más»— para que abrir el selector no arrastre a la iglesia entera.
 */
export function PickerBody({
    target,
    range,
    calendarId,
    ministry,
    onAssign,
    congregationName,
}: {
    target: PickTarget;
    range: DateRange;
    calendarId: string;
    ministry: string | null;
    onAssign: (people: MeetingSlot['believers']) => void;
    congregationName: (id: string | null) => string | undefined;
}) {
    const { t } = useTranslation();
    const [q, setQ] = useState('');
    const [all, setAll] = useState(true);
    const [chosen, setChosen] = useState<SlotPerson[]>(target.slot.believers);

    const preachers = usePreachers(api, { ...range, calendarId, q, all }, true);
    const candidates = preachers.data?.pages.flatMap((page) => page.items) ?? [];
    const createBeliever = useCreateBeliever(api);

    const add = (person: SlotPerson) => {
        setChosen((current) =>
            current.some((one) => one.id === person.id) ? current : [...current, person],
        );
    };
    const remove = (id: string) => {
        setChosen((current) => current.filter((one) => one.id !== id));
    };
    const toggle = (preacher: Preacher) => {
        if (chosen.some((one) => one.id === preacher.id)) remove(preacher.id);
        else add({ id: preacher.id, name: preacher.name });
    };

    const addPerson = async () => {
        const [firstName = q, ...rest] = q.trim().split(/\s+/);
        const person = await createBeliever.mutateAsync({
            firstName,
            lastName: rest.join(' '),
            // Se da de alta ya con el ministerio del calendario: quien se añade
            // desde el de sonido es de sonido.
            ministries: ministry && isMinistry(ministry) ? [ministry] : [],
            congregationId: target.meeting.congregationId,
        });

        const nombre = `${person.firstName} ${person.lastName}`.trim();
        toast.success(t('believers.created', { name: nombre }));
        add({ id: person.id, name: nombre });
        setQ('');
    };

    return (
        <div className="gap-3 flex flex-col">
            <ChosenPeople people={chosen} onRemove={remove} />

            <div className="gap-2 flex items-center">
                <SearchField
                    value={q}
                    onChange={setQ}
                    label={t('calendar.searchPerson')}
                    className="flex-1"
                />
                <Chip
                    active={all}
                    className="h-10 shrink-0"
                    onClick={() => {
                        setAll(!all);
                    }}
                >
                    {t(all ? 'calendar.everyone' : 'calendar.onlyLabor')}
                </Chip>
            </div>

            <ul className="max-h-64 -mx-1 flex flex-col overflow-y-auto">
                {candidates.map((preacher: Preacher) => (
                    <PreacherRow
                        key={preacher.id}
                        preacher={preacher}
                        selected={chosen.some((one) => one.id === preacher.id)}
                        congregationName={congregationName(preacher.congregationId)}
                        onPick={toggle}
                    />
                ))}
            </ul>

            {preachers.hasNextPage && (
                <button
                    type="button"
                    disabled={preachers.isFetchingNextPage}
                    onClick={() => {
                        void preachers.fetchNextPage();
                    }}
                    className="h-10 px-4 text-sm font-medium self-center rounded-lg border bg-card hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
                >
                    {t('calendar.loadMore')}
                </button>
            )}

            {q.trim().length > 1 && (
                <Button
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    isLoading={createBeliever.isPending}
                    onClick={() => void addPerson()}
                >
                    <UserPlus size={15} aria-hidden />
                    {t('believers.addPerson')}: {q.trim()}
                </Button>
            )}

            <div className="gap-2 pt-3 flex items-center justify-between border-t">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        onAssign([]);
                    }}
                >
                    {t('calendar.clearSlot')}
                </Button>
                <Button
                    size="lg"
                    onClick={() => {
                        onAssign(chosen);
                    }}
                >
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
}
