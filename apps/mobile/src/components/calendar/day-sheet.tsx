import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { formatDay } from '@/lib/format';
import type { CalendarRange, Meeting, MeetingSlot } from '@navis/shared';

interface DaySheetProps {
    date: string | null;
    range: CalendarRange | undefined;
    /** Solo el día completo cuando hay más de una sede (D12): por eso el nombre. */
    canManage: boolean;
    onClose: () => void;
    onPick?: (slot: MeetingSlot, meeting: Meeting, date: string) => void;
    onAddMeeting: (date: string) => void;
}

/**
 * El panel del día (RFC 0002 §8.4): una sección por sede, en su orden, cada
 * una con su cinta completa. Las sedes sin nada ese día no ocupan sitio.
 * «Programar otra sede» va al pie, siempre visible con `calendar.manage`.
 */
export function DaySheet({ date, range, canManage, onClose, onPick, onAddMeeting }: DaySheetProps) {
    const { t } = useTranslation();
    if (!date) return null;

    const day = range?.days.find((one) => one.date === date);
    const sedesConAlgo = new Set((day?.meetings ?? []).map((one) => one.congregationId));
    const variada = sedesConAlgo.size > 1;

    return (
        <BottomSheet visible={Boolean(date)} onClose={onClose} title={formatDay(date)}>
            <ScrollView className="gap-3" contentContainerClassName="gap-3 pb-2">
                {variada
                    ? // Una sección por sede, en el orden de la iglesia.
                      range!.congregations
                          .filter((one) => sedesConAlgo.has(one.id))
                          .map((sede) => (
                              <View key={sede.id} className="gap-1.5">
                                  <Text className="text-xs font-sans-medium text-muted-foreground uppercase">
                                      {sede.name}
                                  </Text>
                                  {day!.meetings
                                      .filter((meeting) => meeting.congregationId === sede.id)
                                      .map((meeting, index) => (
                                          <MeetingRibbon
                                              key={`${meeting.name}-${index}`}
                                              meeting={meeting}
                                              onPick={
                                                  canManage
                                                      ? (slot, one) => onPick?.(slot, one, date)
                                                      : undefined
                                              }
                                          />
                                      ))}
                              </View>
                          ))
                    : day?.meetings.map((meeting, index) => (
                          <MeetingRibbon
                              key={`${meeting.name}-${index}`}
                              meeting={meeting}
                              onPick={
                                  canManage ? (slot, one) => onPick?.(slot, one, date) : undefined
                              }
                          />
                      ))}

                {(day?.meetings ?? []).length === 0 ? (
                    <Text className="text-sm text-muted-foreground">
                        {t('calendar.noProgramme')}
                    </Text>
                ) : null}

                {canManage ? (
                    <Button
                        variant="secondary"
                        size="md"
                        title={t('calendar.addMeeting')}
                        onPress={() => onAddMeeting(date)}
                    />
                ) : null}
            </ScrollView>
        </BottomSheet>
    );
}
