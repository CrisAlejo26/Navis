import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet, useNavigate } from 'react-router';

import { Logo } from '@/components/logo';
import { PageTransition } from '@/components/page-transition';
import { Button } from '@/components/ui/button';
import { signOut, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/cn';
import { navItemsFor } from '@/lib/nav';
import { toRole } from '@/lib/roles';

/** Estructura común de la app autenticada: barra lateral en escritorio, inferior en móvil. */
export function AppLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: session } = useSession();

  // Las entradas dependen del rol: la administración de accesos solo la ve
  // quien puede abrirla (ver `navItemsFor`).
  const navItems = navItemsFor(toRole(session?.user.role));

  const handleSignOut = async () => {
    await signOut();
    await navigate('/login', { replace: true });
  };

  return (
    <div className="md:flex-row flex min-h-dvh flex-col">
      <aside className="w-60 p-4 md:flex hidden shrink-0 flex-col border-r bg-card">
        <div className="mb-6 gap-2 px-2 flex items-center">
          <Logo className="h-7 w-7" />
          <p className="text-lg font-semibold">{t('common.appName')}</p>
        </div>

        <nav className="gap-1 flex flex-1 flex-col">
          {navItems.map(({ to, labelKey, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'gap-3 px-3 py-2 text-sm flex items-center rounded-lg transition',
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

        <div className="pt-3 border-t">
          {session?.user.name && (
            <p className="mb-2 px-3 text-xs text-muted-foreground">{session.user.name}</p>
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

      {/* La navegación inferior queda fuera de PageTransition: su `transform`
          crea contexto de apilamiento y el `fixed` dejaría de anclarse. */}
      <main className="p-4 pb-24 md:p-8 md:pb-8 min-w-0 w-full flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Navegación inferior en móvil (la PWA se instala sobre todo en el teléfono).
          Cinco como mucho: más de cinco en una barra inferior quedan ilegibles. */}
      <nav className="inset-x-0 bottom-0 py-2 md:hidden fixed flex justify-around border-t bg-card">
        {navItems.slice(0, 5).map(({ to, labelKey, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'gap-1 px-2 flex flex-col items-center text-[10px]',
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
