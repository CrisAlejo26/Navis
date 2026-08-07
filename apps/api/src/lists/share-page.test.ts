import type { PublicList } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { renderSharePage } from './share-page';

const TOKEN = 'aaaaaaaaaaaaaaaaaaaaaa';

const LISTA: PublicList = {
  churchName: 'Iglesia El Faro',
  name: 'Púlpito',
  description: null,
  accent: '#2140cf',
  updatedAt: '2026-08-03T10:00:00.000Z',
  allowDownload: true,
  restricted: false,
  viewerLabel: null,
  members: [
    {
      position: 0,
      name: 'Juan Pérez',
      note: null,
      congregation: null,
      ministry: null,
      arrivedAt: null,
      arrivalSite: null,
      bibleReadings: null,
      vivenciasReadings: null,
      bibleInstituteTimes: null,
      photoId: null,
    },
    {
      position: 1,
      name: 'Ana Ruiz',
      note: null,
      congregation: null,
      ministry: null,
      arrivedAt: null,
      arrivalSite: null,
      bibleReadings: null,
      vivenciasReadings: null,
      bibleInstituteTimes: null,
      photoId: null,
    },
  ],
};

const base = {
  origin: 'https://navis.example',
  token: TOKEN,
  churchName: 'Iglesia El Faro',
  name: 'Púlpito',
  description: null,
  hasCover: true,
};

describe('el documento con las og:', () => {
  it('pone título, descripción, imagen y URL para la tarjeta de WhatsApp', () => {
    const html = renderSharePage({ ...base, list: LISTA });

    expect(html).toContain('<meta property="og:title" content="Púlpito · Iglesia El Faro">');
    expect(html).toContain(`content="https://navis.example/l/${TOKEN}"`);
    expect(html).toContain(`content="https://navis.example/l/${TOKEN}/card.png"`);
    expect(html).toContain('name="twitter:card"');
  });

  it('cae a la imagen de siempre cuando todavía no hay portada: se degrada, no se rompe', () => {
    const html = renderSharePage({ ...base, hasCover: false, list: LISTA });
    expect(html).toContain('content="https://navis.example/og-image.png"');
  });

  it('lleva noindex: un enlace público no es un sitio web público (D10)', () => {
    expect(renderSharePage({ ...base, list: LISTA })).toContain(
      '<meta name="robots" content="noindex, nofollow">',
    );
  });

  it('redirige a la ruta bonita de la SPA', () => {
    expect(renderSharePage({ ...base, list: LISTA })).toContain(
      `location.replace("/lists/s/${TOKEN}")`,
    );
  });

  it('en una abierta, el noscript trae los nombres', () => {
    const html = renderSharePage({ ...base, list: LISTA });
    expect(html).toContain('<li>Juan Pérez</li>');
    expect(html).toContain('<li>Ana Ruiz</li>');
  });

  it('en una restringida no sale ni un nombre ni el número de personas (D18)', () => {
    const html = renderSharePage({ ...base, list: null });

    expect(html).not.toContain('Juan');
    expect(html).not.toContain('Ana');
    expect(html).not.toContain('<ol>');
    expect(html).toContain('Hace falta un acceso');
  });

  it('la descripción habla de esta lista, no del producto', () => {
    const html = renderSharePage({ ...base, list: LISTA });
    expect(html).toContain(
      '<meta property="og:description" content="Lista de 2 personas, compartida con Navis. Actualizada el 3 de agosto.">',
    );
  });

  it('la descripción de una restringida no se genera del contenido (D18)', () => {
    const html = renderSharePage({ ...base, list: null });
    expect(html).toContain(
      '<meta property="og:description" content="Lista compartida con Navis. Hace falta un acceso para verla.">',
    );
  });

  it('usa la descripción que escribió su dueño cuando la hay', () => {
    const html = renderSharePage({ ...base, description: 'Quién predica este mes', list: LISTA });
    expect(html).toContain('content="Quién predica este mes"');
  });

  it('escapa lo que venga del nombre de la iglesia, que lo escribe una persona', () => {
    const html = renderSharePage({
      ...base,
      churchName: 'El "Faro" <script>alert(1)</script>',
      list: LISTA,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('escapa también los nombres de las personas del noscript', () => {
    const html = renderSharePage({
      ...base,
      list: {
        ...LISTA,
        members: [
          {
            position: 0,
            name: '<b>Juan</b>',
            note: null,
            congregation: null,
            ministry: null,
            arrivedAt: null,
            arrivalSite: null,
            bibleReadings: null,
            vivenciasReadings: null,
            bibleInstituteTimes: null,
            photoId: null,
          },
        ],
      },
    });

    expect(html).toContain('<li>&lt;b&gt;Juan&lt;/b&gt;</li>');
  });

  it('no duplica la barra cuando el origen la trae', () => {
    const html = renderSharePage({ ...base, origin: 'https://navis.example/', list: LISTA });
    expect(html).not.toContain('example//l/');
  });

  it('dice que está vacía en vez de enseñar una lista de cero elementos', () => {
    const html = renderSharePage({ ...base, list: { ...LISTA, members: [] } });
    expect(html).toContain('Todavía no hay nadie en esta lista.');
  });
});
