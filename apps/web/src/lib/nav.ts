import type { Permission } from '@navis/shared';
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  Moon,
  NotebookPen,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Los dos bloques de la navegación, y por qué son dos:
 *
 * · `general` es lo que **no** depende de la iglesia activa —el panel y lo
 *   personal de cada cual—, así que no cambia al cambiar de espacio.
 * · `church` es lo que sí: la agenda, las personas y los avisos de esa
 *   congregación, y las cuentas que la atienden.
 *
 * Separarlos no es decoración: es lo que hace evidente qué se queda igual y qué
 * cambia cuando se cambia de iglesia en el selector de arriba.
 */
export const NAV_GROUPS = [
  { id: 'general', labelKey: 'nav.groupGeneral' },
  { id: 'church', labelKey: 'nav.groupChurch' },
] as const;

export type NavGroup = (typeof NAV_GROUPS)[number]['id'];

/**
 * Qué cuelga de esta entrada, cuando cuelga algo.
 *
 * Es una **propiedad del propio elemento** y no un `item.to === '/calendar'`
 * escrito en `AppNav` (RFC 0010 D3): con dos casos, aquello dejaba de ser una
 * excepción y pasaba a ser una lista disfrazada de condicional.
 */
export type NavChildren = 'calendars' | 'lists';

export interface NavItem {
  to: string;
  labelKey: string;
  Icon: LucideIcon;
  end: boolean;
  /** En qué bloque va. Sin él, al final y sin encabezado (los ajustes). */
  group?: NavGroup;
  /** Permiso para verlo. Sin él, lo ve todo el mundo con sesión. */
  permission?: Permission;
  /** De dónde salen sus subentradas. Sin esto, es una entrada normal. */
  children?: NavChildren;
}

/**
 * Las entradas de la navegación, en un solo sitio: de aquí salen la barra
 * lateral de escritorio y el panel de móvil (Regla 5), y también la
 * navegación de la app de escritorio, que es la misma web.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  {
    to: '/',
    labelKey: 'nav.dashboard',
    Icon: LayoutDashboard,
    end: true,
    group: 'general',
    permission: 'dashboard.view',
  },
  {
    // Sin `permission` a propósito (RFC 0004 D2): las profecías son de cada
    // usuario y no de la iglesia, así que exigir un permiso de rol dejaría a
    // alguien fuera de las suyas propias. Basta con tener sesión.
    to: '/prophecies',
    labelKey: 'nav.prophecies',
    Icon: Sparkles,
    end: false,
    group: 'general',
  },
  {
    // Sin `permission`, por lo mismo (RFC 0005 D2). Antes exigía `dreams.view`,
    // que era un fallo en dos direcciones: dejaba a alguien sin ver **sus
    // propios** sueños y sugería que un administrador podía ver los de otro.
    to: '/dreams',
    labelKey: 'nav.dreams',
    Icon: Moon,
    end: false,
    group: 'general',
  },
  {
    to: '/calendar',
    labelKey: 'nav.calendar',
    Icon: CalendarDays,
    end: false,
    group: 'church',
    permission: 'calendar.view',
    children: 'calendars',
  },
  {
    // «Listas» y no «Listas compartidas»: en alemán es *Geteilte Listen* y a
    // 240 px de barra se corta a media palabra (RFC 0010, «Cómo se llama»). El
    // nombre entero se queda como título de la pantalla.
    to: '/lists',
    labelKey: 'nav.lists',
    Icon: ClipboardList,
    end: false,
    group: 'church',
    permission: 'lists.view',
    children: 'lists',
  },
  {
    to: '/believers',
    labelKey: 'nav.believers',
    Icon: Users,
    end: false,
    group: 'church',
    permission: 'believers.view',
  },
  {
    // El cuaderno **sí** exige permiso (RFC 0017 D10), al revés que
    // profecías y sueños: es de la iglesia y no de cada usuario.
    to: '/journal',
    labelKey: 'nav.journal',
    Icon: NotebookPen,
    end: false,
    group: 'church',
    permission: 'journal.view',
  },
  {
    // Tareas y hábitos son de la cuenta, dentro de la iglesia activa (RFC
    // 0018 D6): un solo permiso, `tasks.view` (D7), igual que el cuaderno.
    to: '/tasks',
    labelKey: 'nav.tasks',
    Icon: CheckCircle2,
    end: false,
    group: 'church',
    permission: 'tasks.view',
  },
  {
    to: '/communications',
    labelKey: 'nav.communications',
    Icon: MessageSquare,
    end: false,
    group: 'church',
    permission: 'communications.view',
  },
  {
    to: '/users',
    labelKey: 'nav.users',
    Icon: ShieldCheck,
    end: false,
    group: 'church',
    permission: 'users.view',
  },
  // Los ajustes de la propia cuenta no llevan permiso ni bloque: quien tiene
  // sesión puede tocar lo suyo, y va al final de la lista.
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings, end: false },
];

/** Deja fuera lo que ese rol no puede abrir. */
export function navItemsFor(can: (permission: Permission) => boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.permission || can(item.permission));
}
