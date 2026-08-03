import type { RoleRow, RoleSortField, SortOrder } from '@navis/shared';
import { useMemo } from 'react';

import { useRoleLabel } from './roles';

interface Options {
  roles: RoleRow[] | undefined;
  search: string;
  sort: RoleSortField;
  order: SortOrder;
}

/**
 * Filtra y ordena el catálogo de roles **en el navegador**, al revés que el
 * listado de usuarios.
 *
 * El motivo: el nombre de los roles de serie no está en la base de datos —se
 * traduce— y el servidor no puede buscar por «Administrador» en seis idiomas.
 * Como el catálogo son unas pocas filas, se trae entero y se filtra sobre el
 * nombre que la persona está viendo, que es lo que espera.
 */
export function useRoleRows({ roles, search, sort, order }: Options): RoleRow[] {
  const label = useRoleLabel();

  return useMemo(() => {
    const term = search.trim().toLowerCase();

    const matches = (role: RoleRow) =>
      !term || label(role).toLowerCase().includes(term) || role.slug.includes(term);

    const compare = (a: RoleRow, b: RoleRow) => {
      if (sort === 'level') return a.level - b.level;
      if (sort === 'usersCount') return a.usersCount - b.usersCount;
      return label(a).localeCompare(label(b));
    };

    const sorted = (roles ?? []).filter(matches).sort(compare);
    return order === 'desc' ? sorted.reverse() : sorted;
    // `label` cambia con el idioma, que es justo cuando hay que reordenar.
  }, [roles, search, sort, order, label]);
}
