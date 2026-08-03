import type { Role } from '@navis/shared';
import {
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string;
  Icon: LucideIcon;
  end: boolean;
  /** Rol mínimo para verlo. Sin él, lo ve todo el mundo. */
  minRole?: Role;
}

/**
 * Las entradas de la navegación, en un solo sitio: de aquí salen la barra
 * lateral de escritorio y la inferior de móvil (Regla 5), y también la
 * navegación de la app de escritorio, que es la misma web.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', Icon: LayoutDashboard, end: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: CalendarDays, end: false },
  { to: '/believers', labelKey: 'nav.believers', Icon: Users, end: false },
  { to: '/prophecies', labelKey: 'nav.prophecies', Icon: Sparkles, end: false },
  { to: '/dreams', labelKey: 'nav.dreams', Icon: Moon, end: false },
  { to: '/communications', labelKey: 'nav.communications', Icon: MessageSquare, end: false },
  { to: '/users', labelKey: 'nav.users', Icon: ShieldCheck, end: false, minRole: 'admin' },
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings, end: false },
];

/** Deja fuera lo que ese rol no puede abrir. */
export function navItemsFor(role: Role | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.minRole || item.minRole === role);
}
