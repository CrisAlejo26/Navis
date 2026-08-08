import { ES_REGIONS } from '@navis/shared';
import { useEffect, useState } from 'react';

import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * Un fichero por país (`scripts/gen-region-data.mjs`), cargado perezoso:
 * `import.meta.glob` sin `eager` deja cada uno como una función que solo
 * pide su trozo cuando se llama — elegir España no descarga México (RFC 0011,
 * ampliación).
 */
const modules = import.meta.glob<{ default: Record<string, string> }>('./regions/*.json');

const cache = new Map<string, Record<string, string>>();

/**
 * Las comunidades de un país, del caché o del fichero. España no tiene
 * fichero a propósito (ver `gen-region-data.mjs`): usa `ES_REGIONS`, la
 * comprobada contra los festivos de verdad. Un país sin datos da un objeto
 * vacío, no un error — el selector cae al código escrito a mano.
 */
export async function loadRegions(country: string): Promise<Record<string, string>> {
  if (country === 'ES') return ES_REGIONS;

  const cached = cache.get(country);
  if (cached) return cached;

  const loader = modules[`./regions/${country}.json`];
  if (!loader) return {};

  const data = (await loader()).default;
  cache.set(country, data);
  return data;
}

function toOptions(data: Record<string, string>): ComboboxOption[] {
  return Object.entries(data)
    .map(([code, name]) => ({ value: code, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/** Las opciones del selector de comunidad, cascada del país elegido. */
export function useRegionOptions(country: string): {
  options: ComboboxOption[];
  loading: boolean;
} {
  const [entry, setEntry] = useState<{ country: string; data: Record<string, string> } | null>(
    null,
  );

  useEffect(() => {
    if (!country) return;
    let alive = true;

    void loadRegions(country)
      .then((data) => {
        if (alive) setEntry({ country, data });
      })
      .catch(() => {
        if (alive) setEntry({ country, data: {} });
      });

    return () => {
      alive = false;
    };
  }, [country]);

  if (!country) return { options: [], loading: false };

  const ready = entry?.country === country;
  return { options: ready ? toOptions(entry.data) : [], loading: !ready };
}

/**
 * El nombre de cada código de `codes`, para «Festivo en X» (RFC 0011).
 *
 * Perezoso también: la primera vez que aparece un festivo de un país sin
 * comunidades cargadas todavía, se ve el código un instante y el nombre en
 * cuanto llega su fichero — el mismo país no se vuelve a pedir.
 */
export function useRegionNames(codes: readonly string[]): Record<string, string> {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const countries = [...new Set(codes.map((code) => code.split('-')[0] ?? code))];
    const pending = countries.filter((country) => country !== 'ES' && !cache.has(country));
    if (pending.length === 0) return;

    let alive = true;
    void Promise.all(pending.map((country) => loadRegions(country)))
      .then(() => {
        if (alive) forceRender((n) => n + 1);
      })
      .catch(() => undefined);

    return () => {
      alive = false;
    };
  }, [codes]);

  const names: Record<string, string> = {};
  for (const code of codes) {
    const country = code.split('-')[0] ?? code;
    const table = country === 'ES' ? ES_REGIONS : (cache.get(country) ?? {});
    names[code] = table[code] ?? code;
  }
  return names;
}
