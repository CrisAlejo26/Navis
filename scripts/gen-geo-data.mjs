/**
 * Genera `apps/mobile/src/lib/geo/geo-data.ts`: los nombres de los países en
 * los seis idiomas y la lista de zonas horarias IANA.
 *
 * Hermes (Android) no trae `Intl.DisplayNames` ni `Intl.supportedValuesOf`, así
 * que los selectores del móvil se quedaban en códigos («AD», «AE»…) y en una
 * sola zona. Node sí tiene los datos completos: se vuelcan aquí, una vez, y se
 * regeneran con `node scripts/gen-geo-data.mjs` si cambian los países.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { COUNTRY_CODES, LOCALES } from '../packages/shared/dist/index.js';

const out = fileURLToPath(new URL('../apps/mobile/src/lib/geo/geo-data.ts', import.meta.url));

const names = {};
for (const locale of LOCALES) {
    const display = new Intl.DisplayNames([locale], { type: 'region' });
    names[locale] = Object.fromEntries(
        COUNTRY_CODES.map((code) => [code, display.of(code) ?? code]),
    );
}

const zones = Intl.supportedValuesOf('timeZone');

const source = `/* Generado por scripts/gen-geo-data.mjs: no se edita a mano. */

export const COUNTRY_NAMES: Record<string, Record<string, string>> = ${JSON.stringify(names)};

export const TIMEZONES: readonly string[] = ${JSON.stringify(zones)};
`;

writeFileSync(out, source);
console.log(
    `${COUNTRY_CODES.length} países × ${LOCALES.length} idiomas, ${zones.length} zonas → ${out}`,
);
