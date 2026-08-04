import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/calendar/accents';
import { dayNumber, rangeTitle, weekdayName } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';
import { TABLE_COLUMN, tableWeeks } from './poster-size';

/**
 * El cuerpo en **tabla**: una columna por día y sede, como la hoja de cálculo
 * que se manda hoy al grupo —«Lunes», «Martes Alicante», «Martes Elda»…— con
 * el día y, debajo, cada fase con su nombre.
 *
 * Es el formato que ya se lee de un vistazo en la iglesia, así que se replica
 * tal cual: cambiar la forma de leerlo sería pedirle a todo el mundo que
 * aprenda otra cosa por gusto.
 *
 * Varias semanas van **una debajo de otra** y no seguidas a lo largo: una tira
 * de veintitantas columnas no se lee en ninguna pantalla.
 */
export function PosterTable({
  range,
  palette,
  congregationName,
  showCongregation,
}: {
  range: CalendarRange;
  palette: PosterPalette;
  congregationName: (id: string) => string;
  /** Con una sola sede a la vista, nombrarla en cada columna sobra. */
  showCongregation: boolean;
}) {
  const semanas = tableWeeks(range);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
      {semanas.map((semana) => (
        <div key={semana.from} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {semanas.length > 1 && (
            <div style={{ fontSize: '22px', fontWeight: 600, color: palette.muted }}>
              {rangeTitle(semana.from, semana.to)}
            </div>
          )}

          <div style={{ display: 'flex', gap: '3px' }}>
            {semana.columns.map(({ date, meetingIndex }) => {
              const day = range.days.find((one) => one.date === date);
              const meeting = day?.meetings[meetingIndex];
              if (!meeting) return null;

              // La sede va **en todas** las columnas mientras haya más de
              // una a la vista: en la hoja de cálculo los días de una sola
              // sede iban sin nombre y nadie sabía de cuál era.
              const cabecera = showCongregation
                ? `${weekdayName(date)} ${congregationName(meeting.congregationId)}`
                : weekdayName(date);

              return (
                <div
                  key={`${date}-${String(meetingIndex)}`}
                  style={{
                    width: `${String(TABLE_COLUMN)}px`,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div
                    style={{
                      background: accentHex(meeting.accent, palette.theme),
                      color: '#ffffff',
                      padding: '11px 12px',
                      fontSize: '21px',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {cabecera}
                  </div>

                  <div
                    style={{
                      border: `1px solid ${palette.border}`,
                      borderTop: 'none',
                      background: palette.card,
                      padding: '14px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '7px',
                      flex: 1,
                    }}
                  >
                    <div style={{ fontSize: '28px', fontWeight: 300 }}>
                      {dayNumber(date)}
                      <span style={{ fontSize: '18px', color: palette.muted }}>
                        {' '}
                        · {meeting.startTime}
                      </span>
                    </div>

                    {/* Qué reunión es —alabanza, enseñanza, estudio bíblico—:
                          sin esto, quien la recibe ve nombres sin saber a qué. */}
                    <div
                      style={{
                        fontSize: '17px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: accentHex(meeting.accent, palette.theme),
                        marginTop: '-4px',
                      }}
                    >
                      {meeting.name}
                    </div>

                    {meeting.slots
                      .filter((slot) => slot.believer)
                      .map((slot) => (
                        <div
                          key={`${slot.name}-${String(slot.position)}`}
                          style={{ fontSize: '21px', lineHeight: 1.25 }}
                        >
                          <span style={{ color: palette.muted }}>{slot.name} </span>
                          <span style={{ fontWeight: 500 }}>{slot.believer?.name}</span>
                          {slot.note && (
                            <span style={{ color: palette.muted, fontSize: '18px' }}>
                              {' '}
                              · {slot.note}
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
