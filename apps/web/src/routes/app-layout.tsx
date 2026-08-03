import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { AppNav } from '@/components/app-nav';
import { Logo } from '@/components/logo';
import { PageTransition } from '@/components/page-transition';
import { SessionFooter } from '@/components/session-footer';
import { Drawer } from '@/components/ui/drawer';
import { useSession } from '@/lib/auth-client';
import { navItemsFor } from '@/lib/nav';
import { toRole } from '@/lib/roles';

/**
 * Estructura común de la app autenticada.
 *
 * En escritorio, barra lateral fija. En móvil, una barra superior con el botón
 * que abre la navegación entera en un panel lateral: las entradas son más de
 * cinco, y en una barra inferior no caben sin quedar ilegibles (Regla 5).
 */
export function AppLayout() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  // Las entradas dependen del rol: la administración de accesos solo la ve
  // quien puede abrirla (ver `navItemsFor`).
  const navItems = navItemsFor(toRole(session?.user.role));
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="md:flex-row flex min-h-dvh flex-col">
      <aside className="w-60 p-4 md:flex hidden shrink-0 flex-col border-r bg-card">
        <div className="mb-6 gap-2 px-2 flex items-center">
          <Logo className="h-7 w-7" />
          <p className="text-lg font-semibold">{t('common.appName')}</p>
        </div>

        <AppNav items={navItems} />
        <SessionFooter />
      </aside>

      <header className="h-14 px-3 gap-3 md:hidden top-0 sticky z-20 flex shrink-0 items-center border-b bg-card">
        <button
          type="button"
          onClick={() => {
            setMenuOpen(true);
          }}
          aria-label={t('nav.menu')}
          aria-expanded={menuOpen}
          className="h-10 w-10 inline-flex cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Menu size={20} aria-hidden />
        </button>
        <Logo className="h-6 w-6" />
        <p className="font-semibold">{t('common.appName')}</p>
      </header>

      <Drawer open={menuOpen} onClose={closeMenu} title={t('nav.menu')}>
        <div className="p-3 flex min-h-full flex-col">
          <AppNav items={navItems} onNavigate={closeMenu} />
          <SessionFooter />
        </div>
      </Drawer>

      <main className="p-4 md:p-8 min-w-0 w-full flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
