import { beforeEach, describe, expect, it } from 'vitest';

import { linkPublicListManifest } from './public-manifest';

function conManifest(href = '/manifest.webmanifest'): HTMLLinkElement {
  document.head.innerHTML = `<link rel="manifest" href="${href}">`;
  return document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
}

describe('el manifest de la página pública de una lista', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('en /lists/s/<token> enlaza el manifest propio de esa lista', () => {
    const link = conManifest();

    linkPublicListManifest('/lists/s/abcdefghijklmnopqrstuv');

    expect(link.getAttribute('href')).toBe('/l/abcdefghijklmnopqrstuv/manifest.webmanifest');
  });

  it('en cualquier otra ruta no toca el manifest general', () => {
    const link = conManifest();

    linkPublicListManifest('/believers');

    expect(link.getAttribute('href')).toBe('/manifest.webmanifest');
  });

  it('no revienta si todavía no hay manifest enlazado', () => {
    expect(() => {
      linkPublicListManifest('/lists/s/abcdefghijklmnopqrstuv');
    }).not.toThrow();
  });

  it('solo lee el token hasta la siguiente barra', () => {
    const link = conManifest();

    linkPublicListManifest('/lists/s/abcdefghijklmnopqrstuv/algo-mas');

    expect(link.getAttribute('href')).toBe('/l/abcdefghijklmnopqrstuv/manifest.webmanifest');
  });
});
