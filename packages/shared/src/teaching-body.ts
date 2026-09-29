import { toSearchName } from './schemas/believers';
import { extractTeachingBodyText } from './teaching-body-text';
import { teachingBodySchema, type TeachingBody } from './schemas/teachings';

/**
 * `body_json` sale de la base de datos como texto: se valida contra el mismo
 * whitelist que el editor, nunca con un `JSON.parse` a pelo (Regla 10). Solo
 * puede fallar si la fila se corrompió por fuera de la aplicación.
 *
 * Vive en `shared` porque la API y la base local del móvil leen la misma
 * columna y tienen que darla por buena — o por mala — igual.
 */
export function parseTeachingBody(bodyJson: string): TeachingBody {
    return teachingBodySchema.parse(JSON.parse(bodyJson));
}

/** Lo que se guarda en `search_text`: título y texto plano del cuerpo, normalizados. */
export function toTeachingSearchText(title: string, body: TeachingBody): string {
    // La misma normalización que `search_name` de creyentes y `search_text` de
    // profecías, y a propósito: si divergieran, una de las búsquedas dejaría de
    // encontrar acentos.
    return toSearchName(`${title} ${extractTeachingBodyText(body).text}`);
}
