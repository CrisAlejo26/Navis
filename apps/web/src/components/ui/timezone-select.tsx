import { useMemo } from 'react';

import { Select } from '@/components/ui/select';

/**
 * Todas las zonas horarias IANA, agrupadas por continente.
 *
 * La lista la da el navegador (`Intl.supportedValuesOf`), así que está siempre
 * al día y no ocupa nada en el paquete. Donde no exista —navegadores viejos y
 * algunos WebView—, se cae a la del propio dispositivo, que es la que acierta
 * en la inmensa mayoría de los casos.
 */
function supportedTimeZones(): string[] {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  return [Intl.DateTimeFormat().resolvedOptions().timeZone];
}

/** `Europe/Madrid` → `Madrid`, y `America/Argentina/Salta` → `Argentina · Salta`. */
function cityOf(zone: string): string {
  const parts = zone.split('/').slice(1);
  return parts.length ? parts.join(' · ').replaceAll('_', ' ') : zone;
}

export function TimezoneSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const groups = useMemo(() => {
    const zones = supportedTimeZones();
    // La zona guardada puede no estar en la lista del navegador; se añade para
    // que el desplegable no la pierda al abrirlo.
    if (defaultValue && !zones.includes(defaultValue)) zones.push(defaultValue);

    const byRegion = new Map<string, string[]>();
    for (const zone of zones.sort((a, b) => a.localeCompare(b))) {
      const region = zone.split('/')[0] ?? zone;
      byRegion.set(region, [...(byRegion.get(region) ?? []), zone]);
    }
    return [...byRegion.entries()];
  }, [defaultValue]);

  return (
    <Select name={name} label={label} defaultValue={defaultValue}>
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region.replaceAll('_', ' ')}>
          {zones.map((zone) => (
            <option key={zone} value={zone}>
              {cityOf(zone)}
            </option>
          ))}
        </optgroup>
      ))}
    </Select>
  );
}
