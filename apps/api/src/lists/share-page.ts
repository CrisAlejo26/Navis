import { listPublicPath, listSharePath, type PublicList } from '@navis/shared';

import { shareDescription } from './share-description';

/**
 * El documento que sirve **la API** en `/l/<token>` (RFC 0010 D14).
 *
 * Es el punto técnico que decide la arquitectura de esta funcionalidad: los
 * rastreadores de WhatsApp, Telegram, Twitter o Slack **no ejecutan
 * JavaScript**, así que una etiqueta `og:` puesta por React no la ve nadie. Sin
 * esto, el enlace se pega en un chat y sale el título genérico de Navis para las
 * cinco listas.
 *
 * Y un efecto secundario que sale gratis y es justo lo que hace falta: el
 * rastreador se queda aquí y no llega al JSON, así que **las vistas previas no
 * cuentan como visitas** (D31).
 */
export interface SharePageInput {
  origin: string;
  token: string;
  churchName: string;
  name: string;
  description: string | null;
  hasCover: boolean;
  /** Nulo en modo restringido: en la vista previa no sale ni un nombre (D18). */
  list: PublicList | null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * El cuerpo exacto del script de redirección, en un sitio propio y no escrito
 * dos veces: `PublicShareController` necesita este mismo texto, carácter a
 * carácter, para calcular su hash y dejarlo pasar por el CSP sin aflojarlo
 * para el resto de la API (`share-page-csp.ts`). Un `<meta refresh>` **no**
 * vale aquí, aunque parezca la salida más simple: a diferencia de un
 * `<script>`, que ningún rastreador ejecuta, WhatsApp sí que **sigue** un
 * `meta refresh` y aterriza en la ruta de la SPA, que no lleva ni una
 * etiqueta `og:` propia — la tarjeta vuelve a salir genérica, que es
 * exactamente el problema que esta página existe para resolver (D14).
 */
export function redirectScript(destino: string): string {
  return `location.replace(${JSON.stringify(destino)});`;
}

export function renderSharePage(input: SharePageInput): string {
  const origin = input.origin.replace(/\/+$/, '');
  const url = `${origin}${listSharePath(input.token)}`;
  const destino = listPublicPath(input.token);
  const title = `${input.name} · ${input.churchName}`;

  const description = shareDescription({ description: input.description, list: input.list });

  const image = input.hasCover ? `${url}/card.png` : `${origin}/og-image.png`;

  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<!-- Un enlace público no es un sitio web público: se comparte con quien se
     comparte, y no se busca en Google (D10). -->
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${escapeHtml(input.churchName)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(url)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${escapeHtml(url)}">
<script>${redirectScript(destino)}</script>
<noscript>${noscriptBody(input, destino, title)}</noscript>`;
}

/**
 * Lo que lee quien no tiene JavaScript, y el rastreador. En modo restringido, el
 * aviso de que hace falta entrar: el formulario, no la lista (D18).
 */
function noscriptBody(input: SharePageInput, destino: string, title: string): string {
  const cabecera = `<h1>${escapeHtml(title)}</h1>`;

  if (!input.list) {
    return `${cabecera}<p>Hace falta un acceso para ver esta lista.</p><p><a href="${destino}">Entrar</a></p>`;
  }

  const filas = input.list.members.map((member) => `<li>${escapeHtml(member.name)}</li>`).join('');

  return `${cabecera}${filas ? `<ol>${filas}</ol>` : '<p>Todavía no hay nadie en esta lista.</p>'}<p><a href="${destino}">Verla en Navis</a></p>`;
}
