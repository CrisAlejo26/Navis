import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { TextField, type TextFieldProps } from '@/components/ui/text-field';

type SearchFieldProps = Omit<
  TextFieldProps,
  'leadingIcon' | 'trailingIcon' | 'label' | 'hideLabel' | 'value' | 'onChangeText'
> & {
  /** Por defecto `common.search`: un campo de búsqueda casi nunca necesita
   * una etiqueta propia distinta de «Buscar». */
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Si no se pasa, limpiar es `onChangeText('')`. */
  onClear?: () => void;
};

/**
 * `TextField` con lupa fija y botón de limpiar — Fase 4. La lupa es
 * decorativa (Regla 2: sin `accessibilityLabel`, `Icon` la oculta sola del
 * lector de pantalla); el botón de limpiar solo aparece con texto escrito.
 */
export function SearchField({ label, value, onChangeText, onClear, ...props }: SearchFieldProps) {
  const { t } = useTranslation();

  return (
    <TextField
      {...props}
      label={label ?? t('common.search')}
      hideLabel
      value={value}
      onChangeText={onChangeText}
      leadingIcon={<Icon name="search" size="sm" />}
      trailingIcon={
        value.length > 0 ? (
          <IconButton
            icon="close-circle"
            accessibilityLabel={t('common.clearSearch')}
            size="sm"
            onPress={() => (onClear ? onClear() : onChangeText(''))}
          />
        ) : null
      }
    />
  );
}
