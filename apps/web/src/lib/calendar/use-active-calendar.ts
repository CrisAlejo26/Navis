import { useCalendars } from '@navis/api-client';
import type { Calendar } from '@navis/shared';
import { useParams } from 'react-router';

import { api } from '@/lib/api';

export interface ActiveCalendar {
  /** El que dice la URL, o el primero si la URL no trae ninguno válido. */
  calendar: Calendar | undefined;
  calendars: readonly Calendar[];
  isLoading: boolean;
}

/**
 * Qué calendario se está mirando: lo dice el `slug` de la URL
 * (`/calendar/pulpito`).
 *
 * El slug y no el identificador porque es lo que se lee, lo que se comparte y
 * lo que sobrevive a renombrar el calendario —al renombrarlo, el slug se
 * queda—.
 */
export function useActiveCalendar(): ActiveCalendar {
  const { slug } = useParams();
  const { data: calendars = [], isLoading } = useCalendars(api);

  return {
    calendar: calendars.find((one) => one.slug === slug) ?? calendars[0],
    calendars,
    isLoading,
  };
}
