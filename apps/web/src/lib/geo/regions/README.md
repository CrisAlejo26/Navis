# Comunidades del selector geográfico

Generado por `scripts/gen-region-data.mjs` — no se edita a mano.

**España no tiene fichero aquí a propósito**: usa `ES_REGIONS` de
`packages/shared`, verificada contra los festivos regionales de verdad (ver
la cabecera del script).

Fuente: [`iso-3166-2.json`](https://raw.githubusercontent.com/olahol/iso-3166-2.json/master/iso-3166-2.json) (Ola Holmström, licencia ISC).
233 de 249 países vigentes tienen datos de
comunidad; el resto se queda sin ficheros aquí y el selector cae al código
ISO 3166-2 escrito a mano (ver `region-field.tsx`).

La cobertura y granularidad vienen tal cual de la fuente: algunos países solo
traen la división de primer nivel, otros mezclan niveles administrativos. Si
un país necesita corrección, se corrige en la fuente y se regenera, no aquí.
