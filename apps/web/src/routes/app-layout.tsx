import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { signOut, useSession } from '@/lib/auth-client';

const navItems = [
  { to: '/', labelKey: 'nav.dashboard', Icon: LayoutDashboard, end: true },
  { to: '/calendar', labelKey: 'nav.calendar', Icon: CalendarDays, end: false },
  { to: '/believers', labelKey: 'nav.believers', Icon: Users, end: false },
  { to: '/prophecies', labelKey: 'nav.prophecies', Icon: Sparkles, end: false },
  { to: '/dreams', labelKey: 'nav.dreams', Icon: Moon, end: false },
  { to: '/communications', labelKey: 'nav.communications', Icon: MessageSquare, end: false },
  { to: '/settings', labelKey: 'nav.settings', Icon: Settings, end: false },
] as const;

/** Estructura común de la app autenticada: barra lateral en escritorio, inferior en móvil. */
export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut();
    await navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="bg-card hidden w-60 shrink-0 flex-col border-r p-4 md:flex">
        <p className="mb-6 px-2 text-lg font-semibold">{t('common.appName')}</p>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ to, labelKey, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon size={18} aria-hidden />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="border-t pt-3">
          {session?.user.name && (
            <p className="text-muted-foreground mb-2 px-3 text-xs">{session.user.name}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => void handleSignOut()}
          >
            <LogOut size={16} aria-hidden />
            {t('auth.signOut')}
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 pb-24 md:p-8 md:pb-8">
        <Outlet />
      </main>

      {/* Navegación inferior en móvil (la PWA se instala sobre todo en el teléfono). */}
      <nav className="bg-card fixed inset-x-0 bottom-0 flex justify-around border-t py-2 md:hidden">
        {navItems.slice(0, 5).map(({ to, labelKey, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-2 text-[10px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <Icon size={20} aria-hidden />
            {t(labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
