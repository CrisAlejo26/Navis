import type { Meeting, MeetingSlot } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { PickerBody } from '@/components/calendar/preacher-picker-body';
import { Dialog } from '@/components/ui/dialog';
import type { DateRange } from '@/lib/calendar/view-range';

export interface PickTarget {
    date: string;
    meeting: Meeting;
    slot: MeetingSlot;
}

/**
 * Asignar en dos toques: se toca la fase y se marca a quién. Una fase admite a
 * cuantas personas hagan falta, así que el selector no se cierra al tocar a
 * alguien: se marcan todas y se guarda.
 *
 * El cuerpo lleva `key` con la fase que se abre: así su estado —a quién se
 * marcó, qué se buscó— nace limpio cada vez, sin copiarlo desde props en un
 * efecto.
 */
export function PreacherPicker({
    target,
    onClose,
    ...body
}: {
    target: PickTarget | null;
    range: DateRange;
    calendarId: string;
    /** El ministerio del calendario: es a quien se propone primero (D16). */
    ministry: string | null;
    onClose: () => void;
    onAssign: (people: MeetingSlot['believers']) => void;
    congregationName: (id: string | null) => string | undefined;
}) {
    const { t } = useTranslation();
    const meetingKey = target ? (target.meeting.id ?? target.meeting.patternId ?? '') : '';

    return (
        <Dialog
            open={Boolean(target)}
            onClose={onClose}
            title={target ? target.slot.name : t('calendar.assign')}
            description={
                target ? `${target.meeting.name} · ${target.meeting.startTime}` : undefined
            }
        >
            {target && (
                <PickerBody
                    key={`${target.date}|${meetingKey}|${String(target.slot.position)}`}
                    target={target}
                    {...body}
                />
            )}
        </Dialog>
    );
}
