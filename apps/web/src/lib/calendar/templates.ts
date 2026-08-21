import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

export const CALENDAR_TEMPLATE_SLUGS = ['sunday', 'prayer', 'offering'] as const;
export type CalendarTemplateSlug = (typeof CALENDAR_TEMPLATE_SLUGS)[number];

export interface CalendarTemplate {
  slug: CalendarTemplateSlug;
  name: string;
  /** El slug de la labor del catálogo de roles, o `null` para «cualquiera». */
  ministrySlug: string | null;
  pattern: {
    name: string;
    /** 0 = domingo, como `Date.getDay()` y como `weekdayHeadings()`. */
    weekday: number;
    startTime: string;
    phases: string[];
  };
}

type PhasesKey =
  | 'calendar.templates.sunday.phases'
  | 'calendar.templates.prayer.phases'
  | 'calendar.templates.offering.phases';

/**
 * `t(key, { returnObjects: true })` no tipa el array de vuelta —el paquete
 * de i18next resuelve un genérico `$SpecialObject` en vez de `string[]`,
 * aunque el recurso sea un array de verdad—, así que el `as` se acota aquí,
 * en un solo sitio y con la clave restringida a las tres que existen
 * (Regla 10 §6): nunca una clave inventada, solo la librería tipando mal una
 * que sí está en `es.ts`.
 */
function phasesOf(t: TFunction, key: PhasesKey): string[] {
  return t(key, { returnObjects: true }) as string[];
}

/**
 * Las plantillas de calendario (RFC 0002, ampliación): un punto de partida al
 * crear uno, con el nombre, la labor y una primera reunión fija ya escritos
 * — igual que la instalación siembra los roles de serie, esto siembra un
 * calendario típico. Todo se puede cambiar después; no es una elección
 * cerrada, es para no empezar en blanco.
 *
 * **«Ofrenda»** propone la labor `coordinador-ofrenda`: quien la lleve cada
 * semana se asigna en esa reunión, igual que un predicador en el culto.
 */
export function useCalendarTemplates(): CalendarTemplate[] {
  const { t } = useTranslation();

  return [
    {
      slug: 'sunday',
      name: t('calendar.templates.sunday.name'),
      ministrySlug: null,
      pattern: {
        name: t('calendar.templates.sunday.name'),
        weekday: 0,
        startTime: '10:00',
        phases: phasesOf(t, 'calendar.templates.sunday.phases'),
      },
    },
    {
      slug: 'prayer',
      name: t('calendar.templates.prayer.name'),
      ministrySlug: null,
      pattern: {
        name: t('calendar.templates.prayer.name'),
        weekday: 3,
        startTime: '19:00',
        phases: phasesOf(t, 'calendar.templates.prayer.phases'),
      },
    },
    {
      slug: 'offering',
      name: t('calendar.templates.offering.name'),
      ministrySlug: 'coordinador-ofrenda',
      pattern: {
        name: t('calendar.templates.offering.name'),
        weekday: 0,
        startTime: '10:00',
        phases: phasesOf(t, 'calendar.templates.offering.phases'),
      },
    },
  ];
}
