import { listPhotoPath, type PublicListMember } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { publicApi } from '@/lib/lists/public-api';
import { formatMonth } from '@/lib/format';
import { publicAssetOrigin } from '@/lib/lists/share-link';

/** 40 ms entre nombres, como quien lee una lista en voz alta (§8.6). */
const CASCADA_MS = 40;

/**
 * **El pase de lista** (RFC 0010 §8.6, D38).
 *
 * Ni tabla ni tarjetas: una columna de nombres, cada uno con **su ordinal a la
 * izquierda en cifra grande y hueca**. Los ordinales están porque el orden es el
 * dato (D6): en una lista de púlpito, el primero predica primero. Es la única
 * razón por la que se numera algo en este proyecto.
 *
 * Los nombres entran uno a uno y es la única animación de la página: menos de
 * medio segundo en total, y con `prefers-reduced-motion` aparecen hechos.
 */
export function RollCall({
  members,
  token,
}: {
  members: readonly PublicListMember[];
  token: string;
}) {
  const { t } = useTranslation();

  return (
    <ol className="gap-1 flex flex-col">
      {members.map((member, index) => (
        <li
          key={`${String(member.position)}-${member.name}`}
          style={{ animationDelay: `${String(index * CASCADA_MS)}ms` }}
          className="gap-4 py-2.5 animate-page-in flex items-baseline border-b border-border/60 last:border-b-0"
        >
          <span
            aria-hidden
            className="w-12 text-3xl font-semibold shrink-0 text-right text-[var(--acento)]/35 tabular-nums"
          >
            {member.position + 1}
          </span>

          {member.photoId && (
            <img
              alt=""
              loading="lazy"
              // En una restringida la foto va detrás de la cookie del acceso;
              // sin esto el navegador la pide **sin cookie** y recibe un 404.
              crossOrigin="use-credentials"
              src={`${publicAssetOrigin(publicApi.baseUrl)}${listPhotoPath(token, member.photoId)}`}
              className="size-9 max-w-none shrink-0 self-center rounded-full border object-cover"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-lg leading-snug">{member.name}</p>
            <p className="gap-2 text-xs flex flex-wrap text-muted-foreground">
              {member.congregation && <span>{member.congregation}</span>}
              {member.ministry && <span>{member.ministry}</span>}
              {member.arrivedAt && (
                <span>
                  {t('believers.journey.arrived')} · {formatMonth(member.arrivedAt)}
                  {member.arrivalSite && ` · ${member.arrivalSite}`}
                </span>
              )}
              {member.bibleReadings !== null && (
                <span>
                  {t('lists.bibleReadings')}: {member.bibleReadings}
                </span>
              )}
              {member.vivenciasReadings !== null && (
                <span>
                  {t('lists.vivenciasReadings')}: {member.vivenciasReadings}
                </span>
              )}
              {member.bibleInstituteTimes !== null && (
                <span>
                  {t('lists.bibleInstituteTimes')}: {member.bibleInstituteTimes}
                </span>
              )}
              {member.note && <span className="italic">«{member.note}»</span>}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
