import { SELECT_RADIO_THRESHOLD, type ColumnOption, type CustomTableColumn } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const HTML_TYPE: Partial<Record<CustomTableColumn['type'], string>> = {
  email: 'email',
  phone: 'tel',
  url: 'url',
};

/**
 * El control de un valor, según el tipo de su columna (RFC 0021, «Los tipos
 * de columna»). Selección única y múltiple pintan radios/casillas hasta seis
 * opciones y un desplegable a partir de ahí (D11).
 */
export function RowField({
  column,
  value,
  onChange,
}: {
  column: CustomTableColumn;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const { t } = useTranslation();
  const options: readonly ColumnOption[] = column.options ?? [];

  if (column.type === 'long_text') {
    return (
      <Textarea
        label={column.label}
        rows={3}
        value={typeof value === 'string' ? value : ''}
        required={column.required}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />
    );
  }

  if (column.type === 'number' || column.type === 'currency') {
    return (
      <Input
        type="number"
        label={column.label}
        value={typeof value === 'number' ? String(value) : ''}
        required={column.required}
        onChange={(event) => {
          onChange(event.target.value === '' ? null : Number(event.target.value));
        }}
      />
    );
  }

  if (column.type === 'checkbox') {
    return (
      <Checkbox
        checked={value === true}
        label={column.label}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
    );
  }

  if (column.type === 'date') {
    return (
      <Input
        type="date"
        label={column.label}
        value={typeof value === 'string' ? value.slice(0, 10) : ''}
        required={column.required}
        onChange={(event) => {
          onChange(event.target.value || null);
        }}
      />
    );
  }

  if (column.type === 'single_select' || column.type === 'multi_select') {
    return (
      <SelectField
        column={column}
        options={options}
        value={value}
        multiple={column.type === 'multi_select'}
        onChange={onChange}
      />
    );
  }

  return (
    <Input
      type={HTML_TYPE[column.type] ?? 'text'}
      label={column.label}
      value={typeof value === 'string' ? value : ''}
      required={column.required}
      placeholder={column.type === 'password' ? t('tables.newPassword') : undefined}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
}

function SelectField({
  column,
  options,
  value,
  multiple,
  onChange,
}: {
  column: CustomTableColumn;
  options: readonly ColumnOption[];
  value: unknown;
  multiple: boolean;
  onChange: (value: unknown) => void;
}) {
  const current: string[] = multiple
    ? ((value as string[] | undefined) ?? [])
    : typeof value === 'string'
      ? [value]
      : [];

  if (options.length > SELECT_RADIO_THRESHOLD) {
    return (
      <Select
        label={column.label}
        multiple={multiple}
        value={multiple ? current : (current[0] ?? '')}
        required={column.required}
        onChange={(event) => {
          if (multiple) {
            const picked = Array.from(event.target.selectedOptions, (one) => one.value);
            onChange(picked);
          } else {
            onChange(event.target.value || null);
          }
        }}
      >
        {!multiple && <option value="" />}
        {options.map((one) => (
          <option key={one.value} value={one.value}>
            {one.label}
          </option>
        ))}
      </Select>
    );
  }

  const toggle = (optionValue: string, checked: boolean) => {
    if (!multiple) {
      onChange(checked ? optionValue : null);
      return;
    }
    onChange(checked ? [...current, optionValue] : current.filter((one) => one !== optionValue));
  };

  return (
    <fieldset className="gap-1.5 flex flex-col">
      <legend className="mb-0.5 text-sm font-medium">{column.label}</legend>
      {options.map((one) =>
        multiple ? (
          <Checkbox
            key={one.value}
            checked={current.includes(one.value)}
            label={one.label}
            onChange={(event) => {
              toggle(one.value, event.target.checked);
            }}
          />
        ) : (
          <label key={one.value} className="gap-2 text-sm flex cursor-pointer items-center">
            <input
              type="radio"
              name={column.key}
              checked={current.includes(one.value)}
              onChange={() => {
                toggle(one.value, true);
              }}
              className="size-4 accent-primary"
            />
            {one.label}
          </label>
        ),
      )}
    </fieldset>
  );
}
