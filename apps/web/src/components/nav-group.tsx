import { ChevronDown, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';

import { MenuButton } from '@/components/ui/menu-button';
import { cn } from '@/lib/cn';
import type { NavItem } from '@/lib/nav';

export interface NavChild {
  to: string;
  label: string;
  /** Con qué editarla o borrarla desde la propia barra (§RFC calendarios/listas/tablas). */
  id: string;
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
  onEditEntry,
  onDeleteEntry,
}: {
  item: NavItem;
  entries: readonly NavChild[];
  collapsed: boolean;
  onNavigate?: () => void;
  /** Alta rápida al pie de la lista, solo para quien puede gestionarlos. */
  onAdd?: () => void;
  /** Ya traducido: no dice lo mismo en calendarios que en listas. */
  addLabel: string;
  /** Editar o borrar una subentrada sin salir de la barra. Sin permiso, sin botón. */
  onEditEntry?: (id: string) => void;
  onDeleteEntry?: (id: string) => void;
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
            <div key={child.to} className="gap-0.5 flex items-center">
              <NavLink
                to={child.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'px-3 py-2 text-sm min-w-0 flex-1 truncate rounded-lg transition-colors duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {child.label}
              </NavLink>

              {/* Editar y borrar, sin salir de la barra — un único disparador
                  compacto en vez de dos iconos sueltos, que en 224 px de ancho
                  no dejan sitio al nombre (Regla 6/Regla 9: nada de más piezas
                  de las que hacen falta). */}
              {(onEditEntry ?? onDeleteEntry) && (
                <MenuButton
                  label={t('common.actions')}
                  iconOnly
                  variant="ghost"
                  size="icon"
                  icon={<MoreHorizontal size={14} aria-hidden />}
                  className="shrink-0"
                  options={[
                    ...(onEditEntry
                      ? [
                          {
                            id: 'edit',
                            label: t('common.edit'),
                            icon: <Pencil size={14} aria-hidden />,
                            onSelect: () => {
                              onEditEntry(child.id);
                            },
                          },
                        ]
                      : []),
                    ...(onDeleteEntry
                      ? [
                          {
                            id: 'delete',
                            label: t('common.delete'),
                            icon: <Trash2 size={14} aria-hidden />,
                            onSelect: () => {
                              onDeleteEntry(child.id);
                            },
                          },
                        ]
                      : []),
                  ]}
                />
              )}
            </div>
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
