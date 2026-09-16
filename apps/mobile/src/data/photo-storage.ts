import { File, Paths } from 'expo-file-system';

/**
 * Dónde viven las fotografías de los creyentes **en el teléfono**: en
 * Documentos, bajo `photos/<id>`, como la API las guarda en `UPLOADS_PATH`
 * (CLAUDE.md: los ficheros no están en la base de datos y no entran en un
 * volcado). La fila solo lleva la URI en `photo_key`, igual que las notas
 * llevan la suya en `file_uri`.
 *
 * Envuelto en funciones pequeñas para que los tests puedan sustituir este
 * módulo entero y no tocar el sistema de ficheros de verdad.
 */

const DIRECTORY = 'photos';

function photoFile(id: string): File {
  return new File(new File(Paths.document, DIRECTORY), id);
}

/**
 * La URI de la foto de una persona: **determinista** —el fichero vive bajo su
 * identificador—, así que el listado no necesita traer la URI en la fila, le
 * basta con saber que la tiene (`hasPhoto`).
 */
export function believerPhotoUri(id: string): string {
  return photoFile(id).uri;
}

/** Copia la imagen elegida a su sitio definitivo y devuelve su URI. */
export async function storeBelieverPhoto(id: string, sourceUri: string): Promise<string> {
  const file = photoFile(id);
  await new File(sourceUri).copy(file);
  return file.uri;
}

export function removeBelieverPhoto(id: string): void {
  const file = photoFile(id);
  if (file.exists) file.delete();
}

/** Borra por URI directa (lo que ya está guardado en la fila). */
export function removeBelieverPhotoAt(uri: string): void {
  const file = new File(uri);
  if (file.exists) file.delete();
}
