export interface WriteBelieverInput {
    firstName: string;
    lastName?: string;
    phone?: string | null;
    email?: string | null;
    congregationId?: string | null;
    status?: string;
    alertAfterDays?: number | null;
    ministries?: string[];
    /** Cuándo empezó cada labor, por `slug`; lo que no esté en `ministries` se cae (RFC 0012). */
    ministryDates?: Record<string, string | null>;
    giftIds?: string[];
    /** Cuándo recibió cada don, por identificador; lo que no esté en `giftIds` se cae. */
    giftDates?: Record<string, string | null>;
    tagIds?: string[];
    /** La que sale en la tabla. Si no está entre las etiquetas, se cae (como en la API). */
    featuredTagId?: string | null;
    arrivedAt?: string | null;
    arrivalSite?: string | null;
    bibleReadings?: number | null;
    vivenciasReadings?: number | null;
    bibleInstituteTimes?: number | null;
    /**
     * La fotografía. `undefined` no la toca; `null` la quita; un URI —el del
     * fichero temporal que eligió quien escribe— la copia a su sitio definitivo
     * (`photos/<id>`) y apunta `photo_key` a él, como hacen las notas con sus
     * audios. El borrado del fichero viejo va dentro: reponer no deja huérfanos.
     */
    photoUri?: string | null;
}
