import { Menu } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

import { AppNav } from '@/components/app-nav';
import { AppSidebar } from '@/components/app-sidebar';
import { CalendarForm } from '@/components/calendar/calendar-form';
import { ListForm } from '@/components/lists/list-form';
import { Logo } from '@/components/logo';
import { PageTransition } from '@/components/page-transition';
import { SessionFooter } from '@/components/session-footer';
import { TableForm } from '@/components/tables/table-form';
import { Drawer } from '@/components/ui/drawer';
import { navItemsFor } from '@/lib/nav';
import { useNavBranches } from '@/lib/nav-branches';
import { usePermissions } from '@/lib/permissions';

/**
 * Estructura común de la app autenticada.
 *
 * En escritorio, barra lateral plegable. En móvil, una barra superior con el botón
 * que abre la navegación entera en un panel lateral: las entradas son más de
 * cinco, y en una barra inferior no caben sin quedar ilegibles (Regla 5).
 */
export function AppLayout() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creando, setCreando] = useState<'calendar' | 'list' | 'table' | null>(null);

  // Las entradas dependen de los permisos del rol: cada una se pinta solo si su
  // pantalla se puede abrir (ver `navItemsFor`).
  const navItems = navItemsFor(can);
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const abrirAlta = useCallback((que: 'calendar' | 'list' | 'table') => {
    setMenuOpen(false);
    setCreando(que);
  }, []);

  const branches = useNavBranches({
    onAddCalendar: can('calendar.manage')
      ? () => {
          abrirAlta('calendar');
        }
      : undefined,
    onAddList: can('lists.manage')
      ? () => {
          abrirAlta('list');
        }
      : undefined,
    onAddTable: can('tables.manage')
      ? () => {
          abrirAlta('table');
        }
      : undefined,
  });

  return (
    <div className="md:flex-row flex min-h-dvh flex-col">
      <AppSidebar items={navItems} branches={branches} />

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
          <AppNav items={navItems} onNavigate={closeMenu} branches={branches} />
          <SessionFooter />
        </div>
      </Drawer>

      <CalendarForm
        open={creando === 'calendar'}
        onClose={() => {
          setCreando(null);
        }}
      />

      <ListForm
        open={creando === 'list'}
        onClose={() => {
          setCreando(null);
        }}
      />

      <TableForm
        open={creando === 'table'}
        onClose={() => {
          setCreando(null);
        }}
      />

      <main className="p-4 md:p-8 min-w-0 w-full flex-1">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
