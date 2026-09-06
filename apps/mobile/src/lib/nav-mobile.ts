import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Los dos bloques del menú, espejo de `NAV_GROUPS` de la web (nav.ts). */
export type MobileNavGroup = 'general' | 'church';

export interface TabBarEntry {
  /** Nombre de la ruta del Tabs (archivo en app/(tabs)/). */
  name: string;
  labelKey: string;
  /** Icono `[activo, inactivo]` del Ionicons. */
  icon: readonly [IoniconName, IoniconName];
}

export interface MenuEntry {
  /** Nombre de la ruta del Stack (archivo en app/). */
  name: string;
  labelKey: string;
  icon: IoniconName;
  group: MobileNavGroup;
  /** RFC que especifica la sección, para la pantalla puente. */
  rfc: string;
}

/**
 * La barra inferior, con el límite de cinco pestañas de la regla de UX.
 * «Más» no navega: abre el menú con el resto de secciones.
 */
export const TAB_BAR_ENTRIES = [
  { name: 'index', labelKey: 'nav.dashboard', icon: ['home', 'home-outline'] },
  { name: 'calendar', labelKey: 'nav.calendar', icon: ['calendar', 'calendar-outline'] },
  { name: 'believers', labelKey: 'nav.believers', icon: ['people', 'people-outline'] },
  {
    name: 'more',
    labelKey: 'nav.more',
    icon: ['ellipsis-horizontal', 'ellipsis-horizontal-outline'],
  },
  { name: 'settings', labelKey: 'nav.settings', icon: ['settings', 'settings-outline'] },
] as const satisfies readonly TabBarEntry[];

/**
 * Lo que cuelga del menú «Más», agrupado igual que la sidebar web: lo personal
 * de cada cual (General) y lo de la iglesia activa (La iglesia).
 */
export const MORE_MENU_ENTRIES = [
  {
    name: 'prophecies',
    labelKey: 'nav.prophecies',
    icon: 'sparkles-outline',
    group: 'general',
    rfc: '0004-profecias-personales.md',
  },
  {
    name: 'dreams',
    labelKey: 'nav.dreams',
    icon: 'moon-outline',
    group: 'general',
    rfc: '0005-suenos-personales.md',
  },
  {
    name: 'teachings',
    labelKey: 'nav.teachings',
    icon: 'school-outline',
    group: 'general',
    rfc: '0022-ensenanzas-personales-plan.md',
  },
  {
    name: 'lists',
    labelKey: 'nav.lists',
    icon: 'list-outline',
    group: 'church',
    rfc: '0010-listas-compartidas.md',
  },
  {
    name: 'tables',
    labelKey: 'nav.tables',
    icon: 'grid-outline',
    group: 'church',
    rfc: '0021-tablas-personalizadas.md',
  },
  {
    name: 'journal',
    labelKey: 'nav.journal',
    icon: 'journal-outline',
    group: 'church',
    rfc: '0017-notas-de-iglesia.md',
  },
  {
    name: 'tasks',
    labelKey: 'nav.tasks',
    icon: 'checkmark-circle-outline',
    group: 'church',
    rfc: '0018-tareas-y-habitos-implementado.md',
  },
  {
    name: 'communications',
    labelKey: 'nav.communications',
    icon: 'chatbubbles-outline',
    group: 'church',
    rfc: '0006-comunicaciones.md',
  },
  {
    name: 'users',
    labelKey: 'nav.users',
    icon: 'shield-checkmark-outline',
    group: 'church',
    rfc: '0008-iglesias-como-espacios-de-trabajo.md',
  },
] as const satisfies readonly MenuEntry[];
