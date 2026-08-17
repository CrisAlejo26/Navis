import { describe, expect, it } from 'vitest';

import { renderListManifest } from './list-manifest';

const base = {
  origin: 'https://navis.example',
  token: 'abcdefghijklmnopqrstuv',
  listName: 'Púlpito',
  churchName: 'Iglesia El Faro',
};

describe('el manifest de una lista', () => {
  it('el start_url, el scope y el id son la ruta pública de la lista, no la raíz', () => {
    const manifest = renderListManifest(base) as Record<string, unknown>;

    expect(manifest.start_url).toBe('https://navis.example/lists/s/abcdefghijklmnopqrstuv');
    expect(manifest.scope).toBe(manifest.start_url);
    expect(manifest.id).toBe(manifest.start_url);
  });

  it('el nombre lleva la lista y la iglesia, para no confundirse con «Navis a secas»', () => {
    const manifest = renderListManifest(base) as Record<string, unknown>;

    expect(manifest.name).toBe('Púlpito · Iglesia El Faro');
  });

  it('el short_name se trunca a 30 caracteres', () => {
    const manifest = renderListManifest({
      ...base,
      listName: 'Un nombre de lista deliberadamente larguísimo, mucho más de treinta',
    }) as Record<string, unknown>;

    expect(manifest.short_name).toHaveLength(30);
  });

  it('no arrastra la barra final del origen', () => {
    const manifest = renderListManifest({ ...base, origin: 'https://navis.example/' }) as Record<
      string,
      unknown
    >;

    expect(manifest.start_url).toBe('https://navis.example/lists/s/abcdefghijklmnopqrstuv');
  });

  it('los tres iconos de Navis, con su maskable', () => {
    const manifest = renderListManifest(base) as { icons: { purpose?: string }[] };

    expect(manifest.icons).toHaveLength(3);
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  });
});
