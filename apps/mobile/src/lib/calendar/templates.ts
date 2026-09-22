import type { TFunction } from 'i18next';

/**
 * Las plantillas de calendario del móvil — la copia de `apps/web/src/lib/
 * calendar/templates.ts` (Regla 1): las **siete** labores que tienen semana de
 * serie, con claves literales y una por plantilla. Nada de `t(`…${slug}`)`,
 * que se salta el tipado y, con una labor nueva en el catálogo («microfono»),
 * acaba mostrando la clave sin traducir.
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
  slug: CalendarTemplateSlug | null;
  name: string;
}

/** Claves literales, una por cada plantilla (Regla 2 §3). */
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

export function useCalendarTemplates(t: TFunction): CalendarTemplate[] {
  return [
    { slug: null, name: t('calendar.templateCustom') },
    ...CALENDAR_TEMPLATE_SLUGS.map((slug) => ({
      slug,
      name: nameFor(t, slug),
    })),
  ];
}
