/** `mm:ss`, que es como se lee el tiempo de un audio en todas partes. */
export function formatSeconds(total: number): string {
  const minutes = Math.floor(total / 60);
  return `${String(minutes)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * Un audio ya subido, en lo que tienen en común los de una nota y los de un
 * sueño (RFC 0005 D13).
 *
 * Los dos son la misma ficha menos la columna que dice de quién cuelgan, y esa
 * es justo la que la interfaz no mira: para pintarlo hacen falta el
 * identificador, cuánto dura y si se grabó o se adjuntó. De dónde se descarga
 * lo dice quien lo usa, con `path`, porque cada uno cuelga de su ruta.
 */
export interface SavedAudio {
  id: string;
  durationSeconds: number | null;
  recorded: boolean;
}

/** De dónde se baja un audio: `noteAudioPath` o `dreamAudioPath`, de `shared`. */
export type AudioPath = (id: string) => string;
