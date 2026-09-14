import type { BelieverStatus, BelieverListItem } from '@navis/shared';
import { themeColorsHex } from '@navis/theme';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  JourneyFields,
  journeyInput,
  type JourneyValues,
} from '@/components/believers/journey-fields';
import type { WriteBelieverInput } from '@/data/repos/believers-repo';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { useCongregations, useGifts, useMinistries, useTags } from '@/hooks/use-catalog';
import { useThemeStore } from '@/lib/theme';

const STATUSES: BelieverStatus[] = ['activo', 'nuevo', 'inactivo', 'trasladado'];

export interface BelieverFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  congregationId: string | null;
  status: BelieverStatus;
  alertOn: boolean;
  alertDays: string;
  ministries: string[];
  giftIds: string[];
  tagIds: string[];
  journey: JourneyValues;
}

export function emptyForm(): BelieverFormValues {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    congregationId: null,
    status: 'activo',
    alertOn: true,
    alertDays: '30',
    ministries: [],
    giftIds: [],
    tagIds: [],
    journey: {
      arrivedAt: null,
      arrivalSite: '',
      bibleReadings: '',
      vivenciasReadings: '',
      bibleInstituteTimes: '',
    },
  };
}

export function formFromBeliever(believer: BelieverListItem): BelieverFormValues {
  return {
    firstName: believer.firstName,
    lastName: believer.lastName,
    phone: believer.phone ?? '',
    email: believer.email ?? '',
    congregationId: believer.congregationId,
    status: believer.status,
    alertOn: believer.alertAfterDays !== null,
    alertDays: String(believer.alertAfterDays ?? 30),
    ministries: [...believer.ministries],
    giftIds: believer.gifts.map((gift) => gift.id),
    tagIds: believer.tags.map((tag) => tag.id),
    journey: {
      arrivedAt: believer.arrivedAt,
      arrivalSite: believer.arrivalSite ?? '',
      bibleReadings: believer.bibleReadings?.toString() ?? '',
      vivenciasReadings: believer.vivenciasReadings?.toString() ?? '',
      bibleInstituteTimes: believer.bibleInstituteTimes?.toString() ?? '',
    },
  };
}

/** Lo que viaja al repo. El aviso apagado es `null`, no cero (D3). */
export function toInput(values: BelieverFormValues): WriteBelieverInput {
  const days = Number.parseInt(values.alertDays, 10);
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim() || null,
    email: values.email.trim() || null,
    congregationId: values.congregationId,
    status: values.status,
    alertAfterDays: values.alertOn ? (Number.isFinite(days) && days > 0 ? days : 30) : null,
    ministries: values.ministries,
    giftIds: values.giftIds,
    tagIds: values.tagIds,
    ...journeyInput(values.journey),
  };
}

interface BelieverFormSheetProps {
  visible: boolean;
  onClose: () => void;
  /** La ficha que se edita, o `null` para dar de alta. */
  believer: BelieverListItem | null;
  onSave: (values: BelieverFormValues) => Promise<void>;
}

/**
 * Alta y edición del hermano (§7.6), en hoja inferior. Los dones y las
 * etiquetas se encienden como pastillas —crear uno nuevo se hace en el
 * catálogo, no aquí— y el aviso es un interruptor con días: apagarlo es
 * `null` (D3).
 *
 * El cuerpo se monta **con `key`** cuando ya hay valores: así su estado nace
 * correcto y ningún `refetch` pisa lo que se está escribiendo (la misma
 * solución que `ProphecyForm` → `ProphecyFormBody`).
 */
export function BelieverFormSheet(props: BelieverFormSheetProps) {
  if (!props.visible) return null;
  return <BelieverFormBody key={props.believer?.id ?? 'new'} {...props} />;
}

function BelieverFormBody({ onClose, believer, onSave }: BelieverFormSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const congregations = useCongregations();
  const ministries = useMinistries();
  const gifts = useGifts();
  const tags = useTags();
  const [values, setValues] = useState<BelieverFormValues>(() =>
    believer ? formFromBeliever(believer) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((one) => one !== value) : [...list, value];

  async function save() {
    if (values.firstName.trim().length < 2) {
      setError(t('believers.firstName'));
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch {
      setError(t('errors.generic'));
    } finally {
      setSaving(false);
    }
  }

  const valid = values.firstName.trim().length >= 2;

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={believer ? t('believers.editPerson') : t('believers.add')}
    >
      <ScrollView
        style={{ maxHeight: height * 0.62 }}
        contentContainerClassName="gap-4 pb-2"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-4 flex-row">
          <View className="flex-1">
            <TextField
              label={t('believers.firstName')}
              value={values.firstName}
              onChangeText={(text) => setValues({ ...values, firstName: text })}
              error={error ?? undefined}
              autoFocus
            />
          </View>
          <View className="flex-1">
            <TextField
              label={t('believers.lastName')}
              value={values.lastName}
              onChangeText={(text) => setValues({ ...values, lastName: text })}
            />
          </View>
        </View>
        <TextField
          label={t('believers.phone')}
          value={values.phone}
          onChangeText={(text) => setValues({ ...values, phone: text })}
          keyboardType="phone-pad"
        />
        <TextField
          label={t('believers.email')}
          value={values.email}
          onChangeText={(text) => setValues({ ...values, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Select
          label={t('believers.congregation')}
          value={values.congregationId ?? ''}
          placeholder={t('believers.noCongregation')}
          options={[
            { value: '', label: t('believers.noCongregation') },
            ...(congregations.data ?? []).map((one) => ({ value: one.id, label: one.name })),
          ]}
          onChange={(value) => setValues({ ...values, congregationId: value || null })}
        />
        <Select
          label={t('believers.statusLabel')}
          value={values.status}
          placeholder={t('believers.status.activo')}
          options={STATUSES.map((status) => ({
            value: status,
            label: t(`believers.status.${status}`),
          }))}
          onChange={(status) => setValues({ ...values, status })}
        />

        <View className="gap-3 p-3 rounded-xl bg-muted">
          <ChipGroup
            label={t('believers.ministries')}
            options={(ministries.data ?? [])
              .filter((one) => one.isActive)
              .map((one) => ({ id: one.slug, name: one.name, accent: one.accent }))}
            selected={values.ministries}
            onToggle={(id) => setValues({ ...values, ministries: toggle(values.ministries, id) })}
          />
          <ChipGroup
            label={t('believers.gifts')}
            options={(gifts.data ?? [])
              .filter((one) => one.isActive)
              .map((one) => ({ id: one.id, name: one.name, accent: one.accent }))}
            selected={values.giftIds}
            onToggle={(id) => setValues({ ...values, giftIds: toggle(values.giftIds, id) })}
          />
          <ChipGroup
            label={t('believerTags.title')}
            options={(tags.data ?? [])
              .filter((one) => one.isActive)
              .map((one) => ({ id: one.id, name: one.name, accent: one.accent }))}
            selected={values.tagIds}
            onToggle={(id) => setValues({ ...values, tagIds: toggle(values.tagIds, id) })}
          />
        </View>

        <Switch
          label={t('believers.alertToggle')}
          checked={values.alertOn}
          onChange={(alertOn) => setValues({ ...values, alertOn })}
        />
        {values.alertOn ? (
          <TextField
            label={t('believers.alertDays')}
            value={values.alertDays}
            onChangeText={(text) =>
              setValues({ ...values, alertDays: text.replaceAll(/[^0-9]/g, '') })
            }
            keyboardType="number-pad"
          />
        ) : null}

        <JourneyFields
          values={values.journey}
          onChange={(journey) => setValues({ ...values, journey })}
        />
      </ScrollView>

      <View
        className="pt-2"
        style={{
          borderTopWidth: 1,
          borderTopColor: themeColorsHex[useThemeStore((state) => state.resolvedTheme)].border,
        }}
      >
        <Button
          title={believer ? t('common.save') : t('believers.add')}
          loading={saving}
          disabled={!valid}
          onPress={() => void save()}
        />
      </View>
    </BottomSheet>
  );
}

function ChipGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: { id: string; name: string; accent: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const palette = themeColorsHex[useThemeStore((state) => state.resolvedTheme)];
  if (options.length === 0) return null;
  return (
    <View className="gap-2">
      <Text className="text-sm font-sans-medium text-foreground">{label}</Text>
      <View className="gap-2 flex-row flex-wrap">
        {options.map((option) => {
          const key = option.accent as keyof typeof palette;
          return (
            <Chip
              key={option.id}
              label={option.name}
              selected={selected.includes(option.id)}
              color={
                option.accent.startsWith('#') ? option.accent : (palette[key] ?? palette.primary)
              }
              onPress={() => onToggle(option.id)}
            />
          );
        })}
      </View>
    </View>
  );
}
