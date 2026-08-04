import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/accents';
import { longDay } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';

/**
 * El cuerpo vertical de la lámina: un bloque por día, con la cinta de fases
 * entera. Es el formato que se lee de un vistazo en un móvil ajeno, así que es
 * el que se propone para un día o una semana.
 *
 * Todo va con estilos en línea y colores en hexadecimal: la lámina se
 * rasteriza a PNG y ni las clases ni `oklch` sobreviven a ese viaje (D14).
 */
export function PosterDays({
  range,
  palette,
  congregationName,
  showCongregation,
  unassignedLabel,
}: {
  range: CalendarRange;
  palette: PosterPalette;
  congregationName: (id: string) => string;
  showCongregation: boolean;
  unassignedLabel: string;
}) {
  const days = range.days.filter((day) => day.meetings.length > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '34px' }}>
      {days.map((day) => (
        <div key={day.date} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: palette.muted,
            }}
          >
            {longDay(day.date)}
          </div>

          {day.meetings.map((meeting, index) => (
            <div
              key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
              style={{ display: 'flex', gap: '18px' }}
            >
              <div
                style={{
                  width: '6px',
                  borderRadius: '3px',
                  background: accentHex(meeting.accent, palette.theme),
                }}
              />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '26px', fontWeight: 600 }}>{meeting.name}</span>
                  <span style={{ fontSize: '22px', color: palette.muted }}>
                    {meeting.startTime}
                  </span>
                  {showCongregation && (
                    <span
                      style={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: accentHex(meeting.accent, palette.theme),
                      }}
                    >
                      {congregationName(meeting.congregationId)}
                    </span>
                  )}
                </div>

                {meeting.slots.map((slot) => (
                  <div
                    key={`${slot.name}-${String(slot.position)}`}
                    style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}
                  >
                    <span
                      style={{
                        width: '250px',
                        fontSize: '18px',
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: palette.muted,
                      }}
                    >
                      {slot.name}
                    </span>
                    <span
                      style={{
                        fontSize: '26px',
                        fontWeight: slot.believer ? 500 : 400,
                        color: slot.believer ? palette.foreground : palette.muted,
                      }}
                    >
                      {slot.believer?.name ?? unassignedLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
