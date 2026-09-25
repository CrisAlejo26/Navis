import type { MeetingSlot } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { PreacherSelector } from '@/components/calendar/preacher-selector';
import { BottomSheet } from '@/components/ui/bottom-sheet';

export interface PickTarget {
    date: string;
    /** Ya materializada: el id de la reunión; propuesta: el del patrón. */
    meetingId?: string;
    patternId?: string;
    position: number;
    /** Quién ocupa la fase al abrirla: el selector arranca con ellos marcados. */
    believers: MeetingSlot['believers'];
}

interface PreacherPickerSheetProps {
    calendarId: string;
    target: PickTarget | null;
    onClose: () => void;
    /** El conjunto entero de la fase. Vacío es «dejarla libre». */
    onSave: (people: MeetingSlot['believers']) => void;
}

/**
 * El selector de personas (RFC 0002 §8.6): **todos los creyentes**, ordenados
 * por quien lleva más tiempo sin subir, con búsqueda y carga infinita. Una fase
 * admite a cuantas personas hagan falta, así que tocar a alguien lo marca y la
 * hoja se cierra al guardar.
 *
 * El selector se **monta con la hoja**: así su estado —a quién se marcó, qué se
 * buscó— nace limpio en cada apertura y ningún efecto lo pisa.
 */
export function PreacherPickerSheet({
    calendarId,
    target,
    onClose,
    onSave,
}: PreacherPickerSheetProps) {
    const { t } = useTranslation();

    return (
        <BottomSheet visible={Boolean(target)} onClose={onClose} title={t('calendar.searchPerson')}>
            {target ? (
                <PreacherSelector
                    calendarId={calendarId}
                    target={target}
                    onSave={(people) => {
                        onSave(people);
                        onClose();
                    }}
                />
            ) : null}
        </BottomSheet>
    );
}
