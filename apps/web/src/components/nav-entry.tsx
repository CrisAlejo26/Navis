import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';

/**
 * Una entrada de la navegación. Plegada se queda en su icono, con el nombre
 * flotando al pasar el ratón o al enfocarla con el teclado.
 */
export function NavEntry({
  item: { to, labelKey, Icon, end },
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <NavLink
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
      {/* Plegada, el nombre sigue ahí para quien navega con lector de pantalla
          o teclado; lo que desaparece es el texto en pantalla. */}
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
  );
}
