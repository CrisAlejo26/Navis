import {
  BELIEVER_STATUSES,
  isBelieverStatus,
  type BelieverListItem,
  type BelieverStatus,
  type Congregation,
  type Gift,
  type MinistryCatalog,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AlertField } from '@/components/believers/alert-field';
import { GiftPicker } from '@/components/believers/gift-picker';
import { JourneyFields, type JourneyDraft } from '@/components/believers/journey-fields';
import { MinistryPicker } from '@/components/believers/ministry-picker';
import { MonthRows } from '@/components/believers/month-rows';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export interface BelieverDraft extends JourneyDraft {
  status: BelieverStatus;
  alertAfterDays: number | null;
  giftIds: string[];
  /** Las labores, por **slug**: es lo que guarda la persona y mira el calendario. */
  ministries: string[];
  /** Cuándo empezó cada labor y cuándo recibió cada don (RFC 0012). */
  ministryDates: Record<string, string | null>;
  giftDates: Record<string, string | null>;
}

/**
 * Los campos de la ficha (§7.6). Están aparte del formulario porque son cosas
 * distintas: aquí, qué se pide y cómo se coloca; allí, qué pasa al guardar.
 *
 * Nombre, apellidos, teléfono y sede van sin estado —los lee `FormData` al
 * enviar—; el estado, los dones y el margen sí lo llevan, porque son controles
 * que no son un `input` con su `name`.
 */
export function BelieverFields({
  believer,
  congregations,
  gifts,
  ministries,
  draft,
  onChange,
}: {
  believer?: BelieverListItem;
  congregations: readonly Congregation[];
  gifts: readonly Gift[];
  ministries: readonly MinistryCatalog[];
  draft: BelieverDraft;
  onChange: (draft: BelieverDraft) => void;
}) {
  const { t } = useTranslation();
  // La principal, y si no la hubiera, la primera que haya: lo que no vale es
  // proponer «sin sede» cuando la iglesia tiene una.
  const defaultCongregationId =
    congregations.find((one) => one.isDefault)?.id ?? congregations[0]?.id ?? '';

  return (
    <>
      <div className="gap-3 sm:grid-cols-2 grid">
        <Input
          name="firstName"
          label={t('believers.firstName')}
          autoComplete="given-name"
          defaultValue={believer?.firstName}
          required
        />
        <Input
          name="lastName"
          label={t('believers.lastName')}
          autoComplete="family-name"
          defaultValue={believer?.lastName}
        />
      </div>

      <div className="gap-3 sm:grid-cols-2 grid">
        <Input
          name="phone"
          type="tel"
          label={t('believers.phone')}
          autoComplete="tel"
          defaultValue={believer?.phone ?? ''}
        />
        <Input
          name="email"
          type="email"
          label={t('believers.email')}
          autoComplete="email"
          defaultValue={believer?.email ?? ''}
        />
      </div>

      <div className="gap-3 sm:grid-cols-2 grid">
        {/* Al **crear**, la sede que se propone es la principal de la iglesia
            en la que se está trabajando: es de donde son casi todos, y dejarlo
            en «sin sede» obligaba a elegirla una por una. Al **editar** se
            respeta lo que haya, incluido no tener ninguna: ahí un valor puesto
            de oficio cambiaría un dato que alguien decidió. */}
        <Select
          name="congregationId"
          label={t('believers.congregation')}
          defaultValue={believer ? (believer.congregationId ?? '') : defaultCongregationId}
        >
          <option value="">{t('believers.noCongregation')}</option>
          {congregations.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </Select>

        <Select
          name="status"
          label={t('believers.statusLabel')}
          value={draft.status}
          onChange={(event) => {
            const next = event.target.value;
            if (isBelieverStatus(next)) onChange({ ...draft, status: next });
          }}
        >
          {BELIEVER_STATUSES.map((one) => (
            <option key={one} value={one}>
              {t(`believers.status.${one}`)}
            </option>
          ))}
        </Select>
      </div>

      <GiftPicker
        gifts={gifts}
        selected={draft.giftIds}
        label={t('believers.gifts')}
        onToggle={(id) => {
          onChange({
            ...draft,
            giftIds: draft.giftIds.includes(id)
              ? draft.giftIds.filter((one) => one !== id)
              : [...draft.giftIds, id],
          });
        }}
      />

      <MinistryPicker
        ministries={ministries}
        selected={draft.ministries}
        label={t('ministries.title')}
        onToggle={(slug) => {
          onChange({
            ...draft,
            ministries: draft.ministries.includes(slug)
              ? draft.ministries.filter((one) => one !== slug)
              : [...draft.ministries, slug],
          });
        }}
      />

      {/* Las fechas van **después** de los dos selectores y solo de lo elegido:
          primero se dice qué tiene, y solo entonces se pregunta desde cuándo. */}
      <MonthRows
        legend={t('believers.journey.giftDates')}
        rows={draft.giftIds.map((id) => ({
          key: id,
          label: gifts.find((one) => one.id === id)?.name ?? id,
        }))}
        values={draft.giftDates}
        onChange={(key, date) => {
          onChange({ ...draft, giftDates: { ...draft.giftDates, [key]: date } });
        }}
      />

      <MonthRows
        legend={t('believers.journey.ministryDates')}
        rows={draft.ministries.map((slug) => ({
          key: slug,
          label: ministries.find((one) => one.slug === slug)?.name ?? slug,
        }))}
        values={draft.ministryDates}
        onChange={(key, date) => {
          onChange({ ...draft, ministryDates: { ...draft.ministryDates, [key]: date } });
        }}
      />

      <JourneyFields
        draft={draft}
        onChange={(journey) => {
          onChange({ ...draft, ...journey });
        }}
      />

      <AlertField
        value={draft.alertAfterDays}
        onChange={(alertAfterDays) => {
          onChange({ ...draft, alertAfterDays });
        }}
      />
    </>
  );
}
