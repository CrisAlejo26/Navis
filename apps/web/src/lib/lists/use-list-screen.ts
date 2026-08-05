import { useList, useLists, type ListDetail } from '@navis/api-client';
import { useParams, useSearchParams } from 'react-router';

import { api } from '@/lib/api';

export const LIST_TABS = ['people', 'stats', 'share'] as const;

export type ListTab = (typeof LIST_TABS)[number];

function isListTab(value: string | null): value is ListTab {
  return (LIST_TABS as readonly string[]).includes(value ?? '');
}

/**
 * Lo que necesita la ficha de una lista: cuál es, sus miembros y en qué pestaña
 * está (RFC 0010 §8.3).
 *
 * La lista se busca **por `slug`** —que es lo que hay en la URL y no cambia al
 * renombrar (D7)— dentro del tablón, que ya está en caché porque de él salen las
 * subentradas de la barra lateral. Así abrir una lista no pide dos veces lo
 * mismo.
 *
 * La pestaña vive en la URL: volver atrás desde un diálogo devuelve a donde
 * estabas, y un enlace a «Compartir» se puede pegar en un mensaje.
 */
export function useListScreen(): {
  detail: ListDetail | undefined;
  listId: string;
  isLoading: boolean;
  notFound: boolean;
  tab: ListTab;
  setTab: (tab: ListTab) => void;
} {
  const { slug = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const { data: lists, isLoading: cargandoTablon } = useLists(api);

  const list = lists?.find((one) => one.slug === slug);
  const { data: detail, isLoading: cargandoFicha } = useList(api, list?.id ?? '', Boolean(list));

  const raw = params.get('tab');

  return {
    detail,
    listId: list?.id ?? '',
    isLoading: cargandoTablon || (Boolean(list) && cargandoFicha),
    notFound: !cargandoTablon && !list,
    tab: isListTab(raw) ? raw : 'people',
    setTab: (tab) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('tab', tab);
          return next;
        },
        { replace: true },
      );
    },
  };
}
