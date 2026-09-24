import { todayIn, type ProphecyFulfillment } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { TextField } from '@/components/ui/text-field';

interface FulfillmentFormValues {
  text: string;
  occurredAt: string;
}

interface ProphecyFulfillmentSheetProps {
  visible: boolean;
  onClose: () => void;
  fulfillment: ProphecyFulfillment | null;
  onSave: (values: FulfillmentFormValues) => Promise<void>;
  onDelete?: () => void;
}

/** Anotar/editar un cumplimiento parcial (D4): qué parte, y cuándo. */
export function ProphecyFulfillmentSheet(props: ProphecyFulfillmentSheetProps) {
  if (!props.visible) return null;
  return <FulfillmentFormBody key={props.fulfillment?.id ?? 'new'} {...props} />;
}

function FulfillmentFormBody({
  onClose,
  fulfillment,
  onSave,
  onDelete,
}: ProphecyFulfillmentSheetProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<FulfillmentFormValues>(() =>
    fulfillment
      ? { text: fulfillment.text, occurredAt: fulfillment.occurredAt }
      : { text: '', occurredAt: todayIn('UTC') },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (values.text.trim().length === 0) {
      setError(t('prophecies.errorFulfillmentEmpty'));
      return;
    }
    setSaving(true);
    try {
      await onSave(values);
      onClose();
    } catch {
      setError(t('prophecies.errorBefore'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet
      visible
      onClose={onClose}
      title={fulfillment ? t('prophecies.editFulfillment') : t('prophecies.addFulfillment')}
    >
      <TextField
        label={t('prophecies.fulfillmentText')}
        value={values.text}
        onChangeText={(text) => setValues({ ...values, text })}
        placeholder={t('prophecies.fulfillmentTextPlaceholder')}
        multiline
        autoFocus
        error={error ?? undefined}
      />
      <DatePicker
        label={t('prophecies.fulfillmentDate')}
        value={values.occurredAt}
        placeholder={t('prophecies.fulfillmentDate')}
        onChange={(day) => setValues({ ...values, occurredAt: day })}
      />
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
