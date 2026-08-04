/** `mm:ss`, que es como se lee el tiempo de un audio en todas partes. */
export function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  return `${String(minutes)}:${String(total % 60).padStart(2, '0')}`;
}
