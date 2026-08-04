import {
  BELIEVER_STATUSES,
  isBelieverStatus,
  type BelieverListItem,
  type BelieverStatus,
  type Congregation,
  type Gift,
} from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { AlertField } from '@/components/believers/alert-field';
import { GiftPicker } from '@/components/believers/gift-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export interface BelieverDraft {
  status: BelieverStatus;
  alertAfterDays: number | null;
  giftIds: string[];
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
  draft,
  onChange,
}: {
  believer?: BelieverListItem;
  congregations: readonly Congregation[];
  gifts: readonly Gift[];
  draft: BelieverDraft;
  onChange: (draft: BelieverDraft) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="gap-3 sm:grid-cols-2 grid">
        <Input
          name="firstName"
          label={t('believers.firstName')}
          autoComplete="given-name"
          defaultValue={believer?.firstName}
        />
        <Input
          name="lastName"
          label={t('believers.lastName')}
          autoComplete="family-name"
          defaultValue={believer?.lastName}
        />
      </div>

      <Input
        name="phone"
        type="tel"
        label={t('believers.phone')}
        autoComplete="tel"
        defaultValue={believer?.phone ?? ''}
      />

      <div className="gap-3 sm:grid-cols-2 grid">
        <Select
          name="congregationId"
          label={t('believers.congregation')}
          defaultValue={believer?.congregationId ?? ''}
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

      <AlertField
        value={draft.alertAfterDays}
        onChange={(alertAfterDays) => {
          onChange({ ...draft, alertAfterDays });
        }}
      />
    </>
  );
}
