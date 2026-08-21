import { Menu } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { AppNav } from '@/components/app-nav';
import { AppSidebar } from '@/components/app-sidebar';
import { Logo } from '@/components/logo';
import { PageTransition } from '@/components/page-transition';
import { SessionFooter } from '@/components/session-footer';
import { SidebarDialogs } from '@/components/sidebar-dialogs';
import { Drawer } from '@/components/ui/drawer';
import { navItemsFor } from '@/lib/nav';
import { usePermissions } from '@/lib/permissions';
import { useSidebarCrud } from '@/lib/use-sidebar-crud';

/**
 * Estructura común de la app autenticada.
 *
 * En escritorio, barra lateral plegable. En móvil, una barra superior con el botón
 * que abre la navegación entera en un panel lateral: las entradas son más de
 * cinco, y en una barra inferior no caben sin quedar ilegibles (Regla 5).
 *
 * Editar y borrar un calendario, una lista o una tabla **sin salir de la
 * barra** vive en `useSidebarCrud` + `SidebarDialogs`: aquí solo se pintan.
 */
export function AppLayout() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);

  // Las entradas dependen de los permisos del rol: cada una se pinta solo si su
  // pantalla se puede abrir (ver `navItemsFor`).
  const navItems = navItemsFor(can);
  const closeMenu = () => {
    setMenuOpen(false);
  };

  const crud = useSidebarCrud(closeMenu);

  return (
    <div className="md:flex-row flex min-h-dvh flex-col">
      <AppSidebar items={navItems} branches={crud.branches} />

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
          <AppNav items={navItems} onNavigate={closeMenu} branches={crud.branches} />
          <SessionFooter />
        </div>
      </Drawer>

      <SidebarDialogs crud={crud} />

      <main className="p-4 md:p-8 min-w-0 w-full flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
