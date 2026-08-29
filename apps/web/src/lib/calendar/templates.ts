import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

/**
 * Las mismas seis labores de serie del catálogo de la iglesia
 * (`SYSTEM_MINISTRIES`) que ya tienen una semana propia. El slug de la
 * plantilla **es** el de la labor: al crear el calendario con esa labor, la
 * API siembra sola la semana que le toca (`defaultWeekFor`, en
 * `packages/shared`) — aquí no hay que repetir días, horas ni fases.
 */
export const CALENDAR_TEMPLATE_SLUGS = [
  'pulpito',
  'recepcion',
  'sonido',
  'biblias',
  'vigilancia',
  'ofrenda',
  'enviar-programacion',
] as const;
export type CalendarTemplateSlug = (typeof CALENDAR_TEMPLATE_SLUGS)[number];

export interface CalendarTemplate {
  slug: CalendarTemplateSlug;
  name: string;
  /** El slug de la labor del catálogo de la iglesia: es lo único que hace falta. */
  ministrySlug: string;
}

/**
 * Claves literales, una por cada plantilla (Regla 2 §3): nada de
 * `t(`calendar.templates.${slug}`)`, que se salta el tipado de `i18next.d.ts`.
 */
function nameFor(t: TFunction, slug: CalendarTemplateSlug): string {
  switch (slug) {
    case 'pulpito':
      return t('calendar.templates.pulpito');
    case 'recepcion':
      return t('calendar.templates.recepcion');
    case 'sonido':
      return t('calendar.templates.sonido');
    case 'biblias':
      return t('calendar.templates.biblias');
    case 'vigilancia':
      return t('calendar.templates.vigilancia');
    case 'ofrenda':
      return t('calendar.templates.ofrenda');
    case 'enviar-programacion':
      return t('calendar.templates.enviarProgramacion');
  }
}

/**
 * Las plantillas de calendario (RFC 0002, ampliación): un punto de partida al
 * crear uno. Elegir una rellena el nombre y la labor, y la labor es la que
 * hace que la API siembre ya la semana de esa labor en cada sede —igual que
 * el púlpito, la recepción, el sonido y las biblias nacen solos con la
 * iglesia—. Todo se puede cambiar después; no es una elección cerrada, es
 * para no empezar en blanco.
 */
export function useCalendarTemplates(): CalendarTemplate[] {
  const { t } = useTranslation();

  return CALENDAR_TEMPLATE_SLUGS.map((slug) => ({
    slug,
    name: nameFor(t, slug),
    ministrySlug: slug,
  }));
}
