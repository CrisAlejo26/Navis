import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AppNav } from '@/components/app-nav';
import { Logo } from '@/components/logo';
import { SessionFooter } from '@/components/session-footer';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';
import { useSidebarStore } from '@/lib/sidebar';

/**
 * La barra lateral de escritorio. Se pliega a una columna de iconos y el
 * estado se recuerda entre recargas (`useSidebarStore`).
 *
 * El ancho sí se anima, aunque no sea una propiedad del compositor: aquí el
 * contenido de al lado tiene que recolocarse de verdad, y con `transform` la
 * barra se movería por encima dejando el hueco. Es un cambio puntual, no un
 * bucle (Regla 9), y `prefers-reduced-motion` lo apaga desde `global.css`.
 *
 * La marca va centrada y grande, y sin el nombre debajo: el barco ya identifica
 * la aplicación y repetirlo escrito solo roba alto a la navegación.
 */
export function AppSidebar({ items }: { items: readonly NavItem[] }) {
  const { t } = useTranslation();
  const collapsed = useSidebarStore((state) => state.collapsed);
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <aside
      className={cn(
        'p-4 ease-out md:flex relative hidden shrink-0 flex-col border-r bg-card transition-[width] duration-300',
        collapsed ? 'w-20' : 'w-60',
      )}
    >
      <div className={cn('flex flex-col items-center', collapsed ? 'mb-4' : 'mb-6')}>
        <Logo
          className={cn(
            'transition-[height,width] duration-300',
            collapsed ? 'h-11 w-11' : 'h-20 w-20',
          )}
        />
      </div>

      {/* Sobre el borde de la barra: no roba sitio a la navegación y queda
          donde la vista ya está mirando al buscar el límite del panel. */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
        aria-expanded={!collapsed}
        className="-right-3.5 top-7 h-7 w-7 absolute z-20 inline-flex cursor-pointer items-center justify-center rounded-full border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {collapsed ? <ChevronRight size={16} aria-hidden /> : <ChevronLeft size={16} aria-hidden />}
      </button>

      <AppNav items={items} collapsed={collapsed} />
      <SessionFooter collapsed={collapsed} />
    </aside>
  );
}
