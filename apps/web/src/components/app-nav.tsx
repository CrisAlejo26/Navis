import { useTranslation } from 'react-i18next';

import { NavEntry } from '@/components/nav-entry';
import { NavGroup, type NavChild } from '@/components/nav-group';
import { cn } from '@/lib/cn';
import { NAV_GROUPS, type NavChildren, type NavItem } from '@/lib/nav';

/** Lo que cuelga de una entrada: sus subentradas y, si se puede, el alta rápida. */
export interface NavBranch {
  entries: readonly NavChild[];
  onAdd?: () => void;
  /** Clave de traducción del botón de añadir, que no dice lo mismo en cada una. */
  addLabelKey: string;
  /** Editar o eliminar una subentrada, sin salir de la barra. Sin permiso, sin acción. */
  onEditEntry?: (id: string) => void;
  onDeleteEntry?: (id: string) => void;
}

/**
 * La lista de entradas de la aplicación, en dos bloques: lo que no cambia al
 * cambiar de iglesia y lo que sí (ver `NAV_GROUPS`). La usan la barra lateral
 * de escritorio y el panel de navegación de móvil: son la misma navegación
 * puesta en dos sitios, no dos listas que haya que mantener a la par.
 *
 * Qué entradas tienen subentradas lo dice **el propio elemento** (`item.children`)
 * y no un `item.to === '/calendar'` escrito aquí: con calendario y listas, dos
 * casos ya no son un caso especial (RFC 0010 D3).
 *
 * Un bloque sin entradas no se pinta: a quien no ve creyentes ni calendario, un
 * encabezado suelto solo le dice lo que se está perdiendo.
 */
export function AppNav({
  items,
  collapsed = false,
  onNavigate,
  branches = {},
}: {
  items: readonly NavItem[];
  /** Solo iconos, para la barra lateral plegada. */
  collapsed?: boolean;
  /** Se llama al pulsar una entrada; en móvil sirve para cerrar el panel. */
  onNavigate?: () => void;
  /** Las subentradas de cada entrada que las tenga, ya venidas de la API. */
  branches?: Partial<Record<NavChildren, NavBranch>>;
}) {
  const { t } = useTranslation();
  const sueltas = items.filter((item) => !item.group);

  const pintar = (item: NavItem) => {
    const branch = item.children ? branches[item.children] : undefined;

    return branch ? (
      <NavGroup
        key={item.to}
        item={item}
        entries={branch.entries}
        collapsed={collapsed}
        onNavigate={onNavigate}
        onAdd={branch.onAdd}
        addLabel={t(branch.addLabelKey)}
        onEditEntry={branch.onEditEntry}
        onDeleteEntry={branch.onDeleteEntry}
      />
    ) : (
      <NavEntry key={item.to} item={item} collapsed={collapsed} onNavigate={onNavigate} />
    );
  };

  return (
    <nav className="gap-1 flex flex-1 flex-col">
      {NAV_GROUPS.map(({ id, labelKey }) => {
        const delGrupo = items.filter((item) => item.group === id);
        if (delGrupo.length === 0) return null;

        return (
          <div key={id} className="mb-1 gap-1 flex flex-col">
            {/* Plegada, el encabezado se queda en una raya: el texto no cabe y
                el bloque se seguiría notando igual. */}
            {collapsed ? (
              <span aria-hidden className="mx-3 my-2 border-t" />
            ) : (
              <p className="px-3 pt-3 pb-1 font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {t(labelKey)}
              </p>
            )}

            {delGrupo.map(pintar)}
          </div>
        );
      })}

      <div className={cn('gap-1 flex flex-col', sueltas.length > 0 && 'mt-1')}>
        {sueltas.map(pintar)}
      </div>
    </nav>
  );
}
