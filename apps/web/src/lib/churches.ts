import { useMyChurches } from '@navis/api-client';
import type { Church } from '@navis/shared';
import { useMemo } from 'react';

import { api } from './api';
import { useSession } from './auth-client';

export interface Churches {
  items: Church[];
  /** La iglesia sobre la que se está trabajando, ya resuelta por el servidor. */
  active: Church | null;
  /** Todavía no se sabe: ni se decide ni se echa a nadie de ninguna pantalla. */
  isLoading: boolean;
}

/**
 * Las iglesias de quien ha entrado y en cuál trabaja.
 *
 * La activa la decide el servidor —y la corrige si la guardada ya no vale—, así
 * que aquí solo se busca en la lista: dos sitios decidiendo lo mismo es como se
 * acaba enseñando una iglesia y consultando otra.
 */
export function useChurches(): Churches {
  const { data: session } = useSession();
  const { data, isLoading } = useMyChurches(api, Boolean(session));

  return useMemo(() => {
    const items = data?.items ?? [];
    return {
      items,
      active: items.find((church) => church.id === data?.activeId) ?? null,
      isLoading: Boolean(session) && isLoading,
    };
  }, [data, session, isLoading]);
}
