import { toSearchName, type PublicListMember } from '@navis/shared';
import { useMemo, useState } from 'react';

export interface PublicFilterState {
  search: string;
  setSearch: (value: string) => void;
  congregation: string | null;
  setCongregation: (value: string | null) => void;
  ministry: string | null;
  setMinistry: (value: string | null) => void;
  /** Solo los valores que esta lista ha compartido de verdad, y nada más. */
  congregations: readonly string[];
  ministries: readonly string[];
  filtered: readonly PublicListMember[];
}

/**
 * Búsqueda y filtros de la página pública, sobre lo que ya se cargó
 * (RFC 0010 §8.6).
 *
 * No piden nada al servidor: la lista pública llega entera de una sola vez
 * —no hay paginación aquí, D33 cuenta visitas, no filas—, así que filtrar en
 * el cliente es lo simple, y de paso no convierte cada letra tecleada en una
 * petición nueva ni en una visita de más.
 *
 * Los filtros solo enseñan **lo que esta lista ha compartido de verdad**
 * (D16): si nadie tiene sede pública, no hay filtro de sede. Se decide
 * mirando los propios datos ya recibidos, nunca una lista fija de campos —así
 * sigue siendo cierto aunque mañana se publique un campo nuevo.
 */
export function usePublicFilter(members: readonly PublicListMember[]): PublicFilterState {
  const [search, setSearch] = useState('');
  const [congregation, setCongregation] = useState<string | null>(null);
  const [ministry, setMinistry] = useState<string | null>(null);

  const congregations = useMemo(
    () => distinctValues(members, (one) => one.congregation),
    [members],
  );
  const ministries = useMemo(() => distinctValues(members, (one) => one.ministry), [members]);

  const filtered = useMemo(() => {
    const query = toSearchName(search.trim());

    return members.filter((member) => {
      if (query && !toSearchName(member.name).includes(query)) return false;
      if (congregation && member.congregation !== congregation) return false;
      if (ministry && member.ministry !== ministry) return false;
      return true;
    });
  }, [members, search, congregation, ministry]);

  return {
    search,
    setSearch,
    congregation,
    setCongregation,
    ministry,
    setMinistry,
    congregations,
    ministries,
    filtered,
  };
}

function distinctValues(
  members: readonly PublicListMember[],
  pick: (member: PublicListMember) => string | null,
): string[] {
  const values = new Set<string>();

  for (const member of members) {
    const value = pick(member);
    if (value) values.add(value);
  }

  return [...values].sort((a, b) => a.localeCompare(b));
}
