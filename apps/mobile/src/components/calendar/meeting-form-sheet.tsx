import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { formatDay } from '@/lib/format';
import { useCreateMeeting } from '@/hooks/use-calendar';
import type { IsoDate } from '@navis/shared';

interface MeetingFormSheetProps {
  date: IsoDate | null;
  calendarId: string;
  congregations: readonly { id: string; name: string; accent: string }[];
  onClose: () => void;
}

const FASES_SUGERIDAS = [
  { label: 'Introducción y cierre', phases: ['Introducción', 'Final'] },
  { label: 'Enseñanza completa', phases: ['Introducción', 'Predicación', 'Testimonios', 'Final'] },
  { label: 'Solo un tramo', phases: ['Encargado'] },
];

/**
 * Una reunión puntual (RFC 0002 §7): la que no nace de ningún patrón, con los
 * chips de atajo de Poppy para no empezar el formulario en blanco.
 *
 * El cuerpo se monta **con `key`**: la hoja no se desmonta entre un día y
 * otro (`onAddMeeting` solo cambia `date`), así que sin esto el nombre, la
 * hora y las fases de la última reunión puntual creada se quedaban puestos
 * al abrir «Añadir reunión» para un día distinto (la misma solución que
 * `BelieverFormSheet`).
 */
export function MeetingFormSheet(props: MeetingFormSheetProps) {
  if (!props.date) return null;
  return <MeetingFormBody key={props.date} {...props} />;
}

function MeetingFormBody({ date, calendarId, congregations, onClose }: MeetingFormSheetProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('Culto');
  const [startTime, setStartTime] = useState('19:00');
  const [sedeId, setSedeId] = useState<string | null>(null);
  const [fases, setFases] = useState(FASES_SUGERIDAS[0].phases);
  const crear = useCreateMeeting(calendarId);

  const sede = sedeId ?? congregations[0]?.id ?? null;

  function guardar() {
    if (!date || !name.trim() || !sede) return;

    crear.mutate(
      {
        congregationId: sede,
        date,
        startTime,
        name,
        phases: fases.map((fase) => ({ name: fase })),
      },
      { onError: () => undefined },
    );
    onClose();
  }

  return (
    <BottomSheet
      visible={Boolean(date)}
      onClose={onClose}
      title={date ? `${t('calendar.addMeeting')} · ${formatDay(date)}` : t('calendar.addMeeting')}
    >
      <View className="gap-3">
        <View className="gap-1.5 flex-row flex-wrap">
          {FASES_SUGERIDAS.map((atajo) => (
            <Button
              key={atajo.label}
              variant={fases === atajo.phases ? 'primary' : 'secondary'}
              size="sm"
              title={atajo.label}
              onPress={() => setFases(atajo.phases)}
            />
          ))}
        </View>

        <TextField label={t('calendar.meetingName')} value={name} onChangeText={setName} />
        <View className="gap-2 flex-row">
          <View className="flex-1">
            <TextField
              label={t('calendar.startTime')}
              value={startTime}
              onChangeText={setStartTime}
            />
          </View>
          <View className="flex-[2]">
            <Select
              label={t('calendar.congregation')}
              placeholder={t('calendar.congregation')}
              value={sede}
              options={congregations.map((one) => ({ value: one.id, label: one.name }))}
              onChange={setSedeId}
            />
          </View>
        </View>

        <Button
          title={t('common.save')}
          onPress={guardar}
          loading={crear.isPending}
          disabled={!name.trim() || !sede}
        />
      </View>
    </BottomSheet>
  );
}
