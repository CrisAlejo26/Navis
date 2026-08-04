import type { CalendarRange } from '@navis/shared';

import { accentHex } from '@/lib/calendar/accents';
import { dayNumber, weekdayHeadings } from '@/lib/calendar/labels';
import type { PosterPalette } from './poster-palette';

/**
 * El cuerpo apaisado: la rejilla del mes. Es el formato para mandar el mes
 * entero o varias semanas, y el que se imprime en A4.
 */
export function PosterGrid({
  range,
  palette,
  month,
}: {
  range: CalendarRange;
  palette: PosterPalette;
  /** `AAAA-MM`: los días de fuera se apagan, no se esconden. */
  month: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {weekdayHeadings().map((heading) => (
          <div
            key={heading.key}
            style={{
              fontSize: '17px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: palette.muted,
            }}
          >
            {heading.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
        {range.days.map((day) => (
          <div
            key={day.date}
            style={{
              minHeight: '150px',
              padding: '10px',
              borderRadius: '10px',
              border: `1px solid ${palette.border}`,
              background: palette.card,
              opacity: day.date.startsWith(month) ? 1 : 0.45,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 300, color: palette.foreground }}>
              {dayNumber(day.date)}
            </div>

            {day.meetings.map((meeting, index) => (
              <div
                key={meeting.id ?? `${meeting.patternId ?? 'x'}-${String(index)}`}
                style={{
                  display: 'flex',
                  gap: '8px',
                  borderLeft: `4px solid ${accentHex(meeting.accent, palette.theme)}`,
                  paddingLeft: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {/* Qué reunión es y a qué hora, antes de los nombres: una
                      lista de personas sin eso no dice a qué se las convoca. */}
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: accentHex(meeting.accent, palette.theme),
                    }}
                  >
                    {meeting.name}
                    <span style={{ fontWeight: 400, color: palette.muted }}>
                      {' '}
                      {meeting.startTime}
                    </span>
                  </span>

                  {meeting.slots
                    .filter((slot) => slot.believer)
                    .map((slot) => (
                      <span
                        key={`${slot.name}-${String(slot.position)}`}
                        style={{ fontSize: '16px', fontWeight: 500, color: palette.foreground }}
                      >
                        {slot.believer?.name}
                      </span>
                    ))}
                  {meeting.slots.some((slot) => !slot.believer) && (
                    <span style={{ fontSize: '15px', color: palette.muted }}>{'·'.repeat(12)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
