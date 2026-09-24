import { todayIn, type CreateProphecyInput, type Prophecy } from '@navis/shared';
import { useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';
import { ProphecyFulfillmentToggle } from '@/components/prophecies/prophecy-fulfillment-toggle';

interface ProphecyFormValues {
  title: string;
  body: string;
  receivedAt: string;
  fulfilledAt: string | null;
}

function emptyForm(): ProphecyFormValues {
  return { title: '', body: '', receivedAt: todayIn('UTC'), fulfilledAt: null };
}

function formFrom(prophecy: Prophecy): ProphecyFormValues {
  return {
    title: prophecy.title,
    body: prophecy.body,
    receivedAt: prophecy.receivedAt,
    fulfilledAt: prophecy.fulfilledAt,
  };
}

export function toInput(values: ProphecyFormValues): CreateProphecyInput {
  return {
    title: values.title,
    body: values.body,
    receivedAt: values.receivedAt,
    fulfilledAt: values.fulfilledAt ?? undefined,
  };
}

interface ProphecyFormSheetProps {
  visible: boolean;
  onClose: () => void;
  /** La profecía que se edita, o `null` para apuntar una nueva. */
  prophecy: Prophecy | null;
  onSave: (values: ProphecyFormValues) => Promise<void>;
  onDelete?: () => void;
}

/**
 * Apuntar/editar una profecía (§4.5): título, cuerpo grande, cuándo se
 * recibió y el interruptor de cumplida. El cuerpo se monta con `key` cuando
 * ya hay valores, igual que `NoteFormSheet` (sin efecto que pise lo que se
 * está escribiendo).
 */
export function ProphecyFormSheet(props: ProphecyFormSheetProps) {
  if (!props.visible) return null;
  return <ProphecyFormBody key={props.prophecy?.id ?? 'new'} {...props} />;
}

function ProphecyFormBody({ onClose, prophecy, onSave, onDelete }: ProphecyFormSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [values, setValues] = useState<ProphecyFormValues>(() =>
    prophecy ? formFrom(prophecy) : emptyForm(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (values.title.trim().length === 0 || values.body.trim().length === 0) {
      setError(t('prophecies.errorEmpty'));
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch {
      setError(t('prophecies.errorOrder'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={prophecy ? t('prophecies.edit') : t('prophecies.add')}
    >
      <ScrollView
        style={{ maxHeight: height * 0.68 }}
        contentContainerClassName="gap-4"
        showsVerticalScrollIndicator={false}
      >
        <TextField
          label={t('prophecies.titleField')}
          value={values.title}
          onChangeText={(text) => setValues({ ...values, title: text })}
          placeholder={t('prophecies.titlePlaceholder')}
          autoFocus={!prophecy}
          error={error ?? undefined}
        />
        <TextField
          label={t('prophecies.bodyField')}
          value={values.body}
          onChangeText={(text) => setValues({ ...values, body: text })}
          placeholder={t('prophecies.bodyPlaceholder')}
          multiline
          numberOfLines={6}
        />
        <DatePicker
          label={t('prophecies.receivedAt')}
          value={values.receivedAt}
          placeholder={t('prophecies.receivedAt')}
          onChange={(day) => setValues({ ...values, receivedAt: day })}
        />
        <ProphecyFulfillmentToggle
          fulfilledAt={values.fulfilledAt}
          onChange={(fulfilledAt) => setValues({ ...values, fulfilledAt })}
        />
      </ScrollView>

      <Button
        title={t('common.save')}
        loading={saving}
        onPress={() => void save()}
        className="mt-2"
      />
      {onDelete ? (
        <Button
          title={t('common.delete')}
          variant="ghost"
          size="sm"
          className="mt-2"
          onPress={() => {
            onClose();
            onDelete();
          }}
        />
      ) : null}
    </BottomSheet>
  );
}
