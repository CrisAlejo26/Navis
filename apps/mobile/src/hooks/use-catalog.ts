import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { BelieverTag, Gift, MinistryCatalog } from '@navis/shared';

import {
  createCatalogEntry,
  deleteCatalogEntry,
  listCongregations,
  listGifts,
  listMinistries,
  listTags,
  updateCatalogEntry,
  type CatalogKind,
} from '@/data/repos/catalog-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los catálogos de la iglesia —dones, labores, etiquetas y sedes— en local.
 * Mismo patrón que `use-believers`: la clave cuelga de la iglesia activa y las
 * mutaciones la invalidan entera, porque el listado y las fichas pintan
 * etiquetas de estos catálogos.
 */

function useChurchId(): string | null {
  return useLocalSession((state) => state.session?.churchId) ?? null;
}

export function useGifts() {
  const churchId = useChurchId();
  return useQuery({
    queryKey: ['catalog', churchId, 'gifts'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return listGifts(churchId);
    },
    enabled: Boolean(churchId),
  });
}

export function useMinistries() {
  const churchId = useChurchId();
  return useQuery({
    queryKey: ['catalog', churchId, 'ministries'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return listMinistries(churchId);
    },
    enabled: Boolean(churchId),
  });
}

export function useTags() {
  const churchId = useChurchId();
  return useQuery({
    queryKey: ['catalog', churchId, 'tags'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return listTags(churchId);
    },
    enabled: Boolean(churchId),
  });
}

export function useCongregations() {
  const churchId = useChurchId();
  return useQuery({
    queryKey: ['catalog', churchId, 'congregations'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return listCongregations(churchId);
    },
    enabled: Boolean(churchId),
  });
}

export function useCatalogMutation() {
  const churchId = useChurchId();
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: ['catalog'] });

  const create = useMutation({
    mutationFn: ({
      kind,
      input,
    }: {
      kind: CatalogKind;
      input: { name: string; accent?: string };
    }) => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return createCatalogEntry(kind, churchId, input);
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      kind,
      id,
      input,
    }: {
      kind: CatalogKind;
      id: string;
      input: { name?: string; accent?: string; isActive?: boolean };
    }) => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return updateCatalogEntry(kind, id, churchId, input);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: ({ kind, id }: { kind: CatalogKind; id: string }) => {
      if (!churchId) throw new Error('Sin iglesia activa');
      return deleteCatalogEntry(kind, id, churchId);
    },
    onSuccess: invalidate,
  });

  return { create, update, remove };
}

export type { Gift, MinistryCatalog, BelieverTag };
