import type { ListPublicFields } from '@navis/shared';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Select } from '@/components/ui/select';

/**
 * **Qué se ve de cada persona** (RFC 0010 D16, §8.5 punto 4).
 *
 * Lista blanca cerrada: lo que no está aquí no sale, y no hay opción para
 * activarlo. Por defecto sale el nombre y la posición, y nada más.
 *
 * La **foto viene apagada a propósito** y con su aviso: publicar la cara de
 * alguien —que puede ser menor— en una URL abierta se decide a conciencia, no
 * en una casilla que ya estaba marcada.
 */
export function PublicFieldsPicker({
  fields,
  onChange,
}: {
  fields: ListPublicFields;
  onChange: (fields: ListPublicFields) => void;
}) {
  const { t } = useTranslation();

  const set = (patch: Partial<ListPublicFields>) => {
    onChange({ ...fields, ...patch });
  };

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="mb-1 text-sm font-medium">{t('lists.publicFields')}</legend>

      <p className="mb-1 text-xs text-muted-foreground">{t('lists.publishFields')}</p>

      <Select
        size="sm"
        label={t('lists.nameStyle')}
        value={fields.nameStyle}
        onChange={(event) => {
          set({ nameStyle: event.target.value === 'initial' ? 'initial' : 'full' });
        }}
      >
        <option value="full">{t('lists.nameFull')}</option>
        <option value="initial">{t('lists.nameInitial')}</option>
      </Select>

      <Checkbox
        checked={fields.congregation}
        label={t('calendar.congregation')}
        onChange={(event) => {
          set({ congregation: event.target.checked });
        }}
      />
      <Checkbox
        checked={fields.ministry}
        label={t('calendar.labor')}
        onChange={(event) => {
          set({ ministry: event.target.checked });
        }}
      />
      <Checkbox
        checked={fields.note}
        label={t('lists.note')}
        onChange={(event) => {
          set({ note: event.target.checked });
        }}
      />

      {/* La trayectoria (RFC 0012): añadida después de que se cerrara esta
          lista blanca (D16). Teléfono y correo no están aquí ni lo van a
          estar — son datos de contacto, esto es historia de la persona. */}
      <Checkbox
        checked={fields.arrival}
        label={t('lists.arrival')}
        onChange={(event) => {
          set({ arrival: event.target.checked });
        }}
      />
      <Checkbox
        checked={fields.bibleReadings}
        label={t('lists.bibleReadings')}
        onChange={(event) => {
          set({ bibleReadings: event.target.checked });
        }}
      />
      <Checkbox
        checked={fields.vivenciasReadings}
        label={t('lists.vivenciasReadings')}
        onChange={(event) => {
          set({ vivenciasReadings: event.target.checked });
        }}
      />
      <Checkbox
        checked={fields.bibleInstituteTimes}
        label={t('lists.bibleInstituteTimes')}
        onChange={(event) => {
          set({ bibleInstituteTimes: event.target.checked });
        }}
      />

      <Checkbox
        checked={fields.photo}
        label={t('lists.photos')}
        onChange={(event) => {
          set({ photo: event.target.checked });
        }}
      />

      {fields.photo && (
        <p className="gap-1.5 text-xs flex items-start text-warning">
          <AlertTriangle size={14} aria-hidden className="mt-0.5 shrink-0" />
          {t('lists.photosWarning')}
        </p>
      )}
    </fieldset>
  );
}
