const PUBLIC_LIST_PATH = /^\/lists\/s\/([^/]+)/;

/**
 * Si la página que se está cargando es la pública de una lista, cambia el
 * manifest enlazado al propio de esa lista, para que instalarla como
 * aplicación abra directamente ahí y no en el inicio de sesión general
 * (RFC 0010, «PWA por lista»): `start_url` y `scope` son la ruta de la lista,
 * no `/`.
 *
 * Se llama **antes de montar React**, en `main.tsx`, y no en un efecto:
 * `PwaUpdatePrompt` registra el service worker en el primer render, y un
 * efecto de `PublicListPage` llegaría tarde a esa carrera. Aquí siempre gana,
 * porque nada más ha corrido todavía — y para cuando este módulo se ejecuta,
 * el documento ya está parseado entero (los `<script type="module">` son
 * diferidos), así que el `<link rel="manifest">` que inyecta `vite-plugin-pwa`
 * al final de `<head>` ya existe.
 */
export function linkPublicListManifest(pathname: string = globalThis.location.pathname): void {
  const match = PUBLIC_LIST_PATH.exec(pathname);
  if (!match?.[1]) return;

  const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) return;

  link.href = `/l/${match[1]}/manifest.webmanifest`;
}
