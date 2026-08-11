/**
 * `2026-08-12T19:00:00.000Z` → `2026-08-12 19:00`: sencillo y ordenable, sin
 * palabras de ningún idioma. Lo usan el Markdown del cuaderno (RFC 0017 D12)
 * y la transcripción de una conversación (RFC 0019).
 */
export function toPlainDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const dos = (value: number) => String(value).padStart(2, '0');
  return `${String(date.getFullYear())}-${dos(date.getMonth() + 1)}-${dos(date.getDate())} ${dos(date.getHours())}:${dos(date.getMinutes())}`;
}
