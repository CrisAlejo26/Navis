import { ChevronDown, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';

export interface NavChild {
  to: string;
  label: string;
}

/**
 * Una entrada con **subentradas**: «Calendario» y, colgando, uno por cada
 * calendario de la iglesia —púlpito, recepción, sonido, biblias— (RFC 0002
 * D15).
 *
 * Se abre sola cuando se está dentro de uno de sus hijos, y a partir de ahí
 * manda quien la haya plegado a mano. Plegada la barra, el grupo se comporta
 * como una entrada normal que lleva al primero: en una columna de iconos no
 * hay sitio para un árbol.
 */
export function NavGroup({
  item,
  entries,
  collapsed,
  onNavigate,
  onAdd,
  addLabel,
}: {
  item: NavItem;
  entries: readonly NavChild[];
  collapsed: boolean;
  onNavigate?: () => void;
  /** Alta rápida al pie de la lista, solo para quien puede gestionarlos. */
  onAdd?: () => void;
  /** Ya traducido: no dice lo mismo en calendarios que en listas. */
  addLabel: string;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const dentro = pathname.startsWith(item.to);
  const [abierto, setAbierto] = useState<boolean | null>(null);
  const open = abierto ?? dentro;

  if (collapsed || entries.length === 0) {
    return (
      <NavLink
        to={entries[0]?.to ?? item.to}
        onClick={onNavigate}
        className={cn(
          'group gap-3 px-3 py-2.5 text-sm relative flex items-center rounded-lg transition-colors duration-200',
          collapsed && 'justify-center',
          dentro
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <item.Icon size={18} aria-hidden className="shrink-0" />
        <span className={cn(collapsed && 'sr-only')}>{t(item.labelKey)}</span>
        {collapsed && (
          <span
            aria-hidden
            className="ml-2 px-2 py-1 text-xs shadow-md pointer-events-none absolute left-full z-30 origin-left scale-95 rounded-md border bg-popover whitespace-nowrap text-popover-foreground opacity-0 transition duration-150 group-hover:scale-100 group-hover:opacity-100"
          >
            {t(item.labelKey)}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setAbierto(!open);
        }}
        className={cn(
          'gap-3 px-3 py-2.5 text-sm flex w-full cursor-pointer items-center rounded-lg transition-colors duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          dentro ? 'text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <item.Icon size={18} aria-hidden className="shrink-0" />
        <span className="flex-1 truncate text-left">{t(item.labelKey)}</span>
        <ChevronDown
          size={14}
          aria-hidden
          className={cn('shrink-0 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 gap-0.5 pl-2 flex flex-col border-l">
          {entries.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 text-sm truncate rounded-lg transition-colors duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              {child.label}
            </NavLink>
          ))}

          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="gap-2 px-3 py-2 text-sm flex cursor-pointer items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Plus size={14} aria-hidden />
              {addLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
