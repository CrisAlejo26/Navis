import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';

/**
 * La lista de entradas de la aplicación. La usan la barra lateral de
 * escritorio y el panel de navegación de móvil: son la misma navegación
 * puesta en dos sitios, no dos listas que haya que mantener a la par.
 */
export function AppNav({
  items,
  collapsed = false,
  onNavigate,
}: {
  items: readonly NavItem[];
  /** Solo iconos, para la barra lateral plegada. */
  collapsed?: boolean;
  /** Se llama al pulsar una entrada; en móvil sirve para cerrar el panel. */
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <nav className="gap-1 flex flex-1 flex-col">
      {items.map(({ to, labelKey, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              // 44 px de alto: es el mínimo de un objetivo táctil (Regla 5).
              'group gap-3 px-3 py-2.5 text-sm relative flex items-center rounded-lg transition-colors duration-200',
              collapsed && 'justify-center',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          <Icon size={18} aria-hidden className="shrink-0" />
          {/* Plegada, el nombre sigue ahí para quien navega con lector de
              pantalla o teclado; lo que desaparece es el texto en pantalla. */}
          <span className={cn(collapsed && 'sr-only')}>{t(labelKey)}</span>
          {collapsed && (
            <span
              aria-hidden
              className="ml-2 px-2 py-1 text-xs shadow-md pointer-events-none absolute left-full z-30 origin-left scale-95 rounded-md border bg-popover whitespace-nowrap text-popover-foreground opacity-0 transition duration-150 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
            >
              {t(labelKey)}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
