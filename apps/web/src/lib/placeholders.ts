import type { Permission } from '@navis/shared';

import type { NavKey } from '@/routes/placeholder';

/**
 * Las secciones que todavía son un puente a su RFC. Van en una lista y no
 * escritas una a una porque son la misma ruta seis veces: cuando una se
 * implemente, sale de aquí y se escribe con su propia pantalla.
 */
export const PUENTES = [
  {
    path: 'calendar',
    titleKey: 'nav.calendar',
    rfc: '0002-calendario-de-programaciones.md',
    permission: 'calendar.view',
  },
  {
    path: 'believers',
    titleKey: 'nav.believers',
    rfc: '0003-creyentes-y-notas.md',
    permission: 'believers.view',
  },
  {
    path: 'prophecies',
    titleKey: 'nav.prophecies',
    rfc: '0004-profecias-personales.md',
    permission: 'prophecies.view',
  },
  {
    path: 'dreams',
    titleKey: 'nav.dreams',
    rfc: '0005-suenos-personales.md',
    permission: 'dreams.view',
  },
  {
    path: 'communications',
    titleKey: 'nav.communications',
    rfc: '0006-comunicaciones.md',
    permission: 'communications.view',
  },
] as const satisfies readonly {
  path: string;
  titleKey: NavKey;
  rfc: string;
  permission: Permission;
}[];
