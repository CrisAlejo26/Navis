import { createHash } from 'node:crypto';

import helmet from 'helmet';
import type { Request, Response } from 'express';

const DEFAULT_DIRECTIVES = helmet.contentSecurityPolicy.getDefaultDirectives();

/**
 * El CSP global (`main.ts`) va con `script-src 'self'`, y eso bloquea
 * cualquier `<script>` en línea sin nonce ni hash — el que usa esta única
 * página para redirigir sin que un rastreador lo siga (`share-page.ts`).
 *
 * Aflojar `script-src` para **toda** la API por una sola ruta sería más
 * agujero que arreglo, así que aquí se sustituye la cabecera que ya puso el
 * middleware global, **solo en esta respuesta**, añadiendo el hash exacto
 * del script que se sirve. Se reutiliza el propio `helmet` para construirla
 * —y no una plantilla de cabecera escrita a mano— para que no se desvíe de lo
 * que ya hace el resto de la API si un día cambian los valores por defecto.
 */
export function applySharePageCsp(
  request: Request,
  response: Response,
  scriptContent: string,
): void {
  const hash = createHash('sha256').update(scriptContent, 'utf8').digest('base64');
  const scriptSrc = [...(DEFAULT_DIRECTIVES['script-src'] ?? []), `'sha256-${hash}'`];

  helmet.contentSecurityPolicy({
    directives: { ...DEFAULT_DIRECTIVES, 'script-src': scriptSrc },
  })(request, response, () => {
    /* helmet solo escribe la cabecera; aquí no hay más middleware que encadenar. */
  });
}
