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
  onNavigate,
}: {
  items: readonly NavItem[];
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
              'gap-3 px-3 py-2.5 text-sm flex items-center rounded-lg transition-colors duration-200',
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
  );
}
