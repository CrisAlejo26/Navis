import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppNav } from '@/components/app-nav';
import { ChurchSwitcher } from '@/components/church-switcher';
import { Logo } from '@/components/logo';
import { SessionFooter } from '@/components/session-footer';
import { cn } from '@/lib/cn';
import type { NavChild } from '@/components/nav-group';
import type { NavItem } from '@/lib/nav';
import { useSidebarStore } from '@/lib/sidebar';

/**
 * La barra lateral de escritorio. Se pliega a una columna de iconos y el
 * estado se recuerda entre recargas (`useSidebarStore`).
 *
 * Cuatro franjas separadas por líneas —marca, iglesia, navegación y sesión—:
 * cada una responde a una pregunta distinta (qué aplicación es esta, dónde
 * estoy trabajando, a dónde voy y quién soy), y la línea es lo que evita
 * tener que leerlas todas juntas.
 *
 * El ancho sí se anima, aunque no sea una propiedad del compositor: aquí el
 * contenido de al lado tiene que recolocarse de verdad, y con `transform` la
 * barra se movería por encima dejando el hueco. Es un cambio puntual, no un
 * bucle (Regla 9), y `prefers-reduced-motion` lo apaga desde `global.css`.
 */
export function AppSidebar({
  items,
  calendars,
  onAddCalendar,
}: {
  items: readonly NavItem[];
  calendars?: readonly NavChild[];
  onAddCalendar?: () => void;
}) {
  const { t } = useTranslation();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <aside
      className={cn(
        'ease-out md:flex relative hidden shrink-0 flex-col border-r bg-card transition-[width] duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Sobre el borde y a media altura: no roba sitio a nada y queda donde la
          vista ya está mirando al buscar el límite del panel. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        aria-expanded={!collapsed}
        className="-right-3 h-6 w-6 shadow-sm absolute top-1/2 z-20 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? <ChevronRight size={14} aria-hidden /> : <ChevronLeft size={14} aria-hidden />}
      </button>

      <div
        className={cn('h-16 gap-2.5 px-4 flex shrink-0 items-center border-b', collapsed && 'px-0')}
      >
        <Logo className={cn('h-7 w-7', collapsed && 'mx-auto')} />
        {!collapsed && (
          <span className="font-semibold truncate text-[15px] tracking-[-0.01em]">
            {t('common.appName')}
          </span>
        )}
      </div>

      <div className={cn('p-2 shrink-0 border-b', collapsed && 'flex justify-center')}>
        <ChurchSwitcher collapsed={collapsed} />
      </div>

      <div className="min-h-0 p-2 flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <AppNav
          items={items}
          collapsed={collapsed}
          calendars={calendars}
          onAddCalendar={onAddCalendar}
        />
      </div>

      <div className="p-2 shrink-0">
        <SessionFooter collapsed={collapsed} />
      </div>
    </aside>
  );
}
