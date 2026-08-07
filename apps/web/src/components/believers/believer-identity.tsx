import { useMinistries } from '@navis/api-client';
import {
  believerName,
  type BelieverListItem,
  type Congregation,
  type IsoDate,
} from '@navis/shared';
import { Mail, NotebookPen, Pencil, Phone, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { BelieverVocabulary } from '@/components/believers/believer-vocabulary';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { formatDay } from '@/lib/format';

interface IdentityProps {
  believer: BelieverListItem;
  congregation: Congregation | undefined;
  today: IsoDate;
  canManage: boolean;
  onNote: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * **Quién es**: la cabecera de la ficha (§7.5).
 *
 * Es una banda a lo ancho y teñida con el color de su sede, como la ficha de un
 * sueño lo está con sus emociones: el color lo pone el dato y no la pantalla,
 * así que dos personas no se abren iguales. Era una columna de 22 rem a la
 * izquierda, y con ella la bitácora —que es lo que se viene a leer— empezaba a
 * media pantalla.
 *
 * «Añadir nota» es la acción principal y va a 48 px: es lo que más se pulsa y
 * se pulsa de pie (Regla 5 §4).
 */
export function BelieverIdentity({
  believer,
  congregation,
  today,
  canManage,
  onNote,
  onEdit,
  onDelete,
}: IdentityProps) {
  const { t } = useTranslation();
  const name = believerName(believer);
  // El catálogo, para resolver los slugs que tiene la persona a nombre y color.
  const { data: ministries = [] } = useMinistries(api);

  return (
    <header
      style={congregation ? accentVars(congregation.accent) : undefined}
      className={
        congregation
          ? 'gap-4 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border bg-gradient-to-br from-[var(--acento)]/18 to-[var(--acento)]/4'
          : 'gap-4 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border bg-muted'
      }
    >
      <div className="gap-3 flex items-start justify-between">
        {/* La foto, si la hay. Si no, no se reserva hueco: la cabecera se
            recoloca sola y nadie ve un círculo vacío. */}
        <BelieverPhoto believer={believer} size="lg" className="mt-0.5" />

        <div className="min-w-0 flex-1">
          {congregation && (
            <p className="gap-1.5 text-xs tracking-wide flex items-center text-muted-foreground uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-[var(--acento)]" />
              {congregation.name}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{name}</h1>
        </div>

        {canManage && (
          <span className="gap-0.5 flex shrink-0">
            <Button variant="ghost" size="icon" aria-label={t('common.edit')} onClick={onEdit}>
              <Pencil size={16} aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('believers.deleteTitle', { name })}
              className="hover:bg-destructive/10 hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 size={16} aria-hidden />
            </Button>
          </span>
        )}
      </div>

      <div className="gap-x-3 gap-y-2 flex flex-wrap items-center">
        <StatusBadge status={believer.status} />

        {believer.phone && (
          <a
            href={`tel:${believer.phone}`}
            aria-label={t('believers.callPhone', { name })}
            className="gap-1 text-xs inline-flex items-center rounded-sm text-muted-foreground tabular-nums hover:text-foreground"
          >
            <Phone size={12} aria-hidden />
            {believer.phone}
          </a>
        )}

        {believer.email && (
          <a
            href={`mailto:${believer.email}`}
            aria-label={t('believers.emailPerson', { name })}
            className="gap-1 text-xs inline-flex items-center rounded-sm text-muted-foreground hover:text-foreground"
          >
            <Mail size={12} aria-hidden />
            {believer.email}
          </a>
        )}
      </div>

      <BelieverVocabulary
        gifts={believer.gifts}
        ministrySlugs={believer.ministries}
        catalog={ministries}
      />

      {/* La sonda y su frase: cuánto margen queda antes de que toque escribir
          algo de esta persona (RFC 0003). */}
      <div className="gap-2 sm:max-w-md flex flex-col">
        <Sonda believer={believer} today={today} variant="block" />
        <p className="text-xs text-muted-foreground">
          {believer.lastNoteAt
            ? t('believers.alert.lastNote', { date: formatDay(believer.lastNoteAt) })
            : t('believers.alert.never')}
          {believer.alertAfterDays !== null && (
            <> · {t('believers.alert.margin', { days: believer.alertAfterDays })}</>
          )}
        </p>
      </div>

      {canManage && (
        <Button size="lg" className="self-start" onClick={onNote}>
          <NotebookPen size={18} aria-hidden />
          {t('notes.add')}
        </Button>
      )}
    </header>
  );
}
