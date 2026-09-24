import { File, Paths } from 'expo-file-system';

/**
 * Dónde viven los audios de las notas **en el teléfono**: en Documentos, bajo
 * `audios/<id>`, igual que la API los guarda en `UPLOADS_PATH` (CLAUDE.md: los
 * ficheros no están en la base de datos y no entran en un volcado).
 *
 * Envuelto en funciones pequeñas para que los tests puedan sustituir este
 * módulo entero y no tocar el sistema de ficheros de verdad.
 */

const DIRECTORY = 'audios';

function audioFile(id: string): File {
    return new File(new File(Paths.document, DIRECTORY), id);
}

export function audioUri(id: string): string {
    return audioFile(id).uri;
}

/** Copia la grabación a su sitio definitivo y devuelve su URI. */
export async function storeAudio(id: string, sourceUri: string): Promise<string> {
    const file = audioFile(id);
    await new File(sourceUri).copy(file);
    return file.uri;
}

export function removeAudio(id: string): void {
    const file = audioFile(id);
    if (file.exists) file.delete();
}

/** Borra por URI directa (lo que ya está guardado en la fila). */
export function removeAudioAt(uri: string): void {
    const file = new File(uri);
    if (file.exists) file.delete();
}
