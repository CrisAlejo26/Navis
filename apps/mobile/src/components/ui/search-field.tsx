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
    /** Clases para el contenedor: la variante de vidrio sobre una escena. */
    containerClassName?: string;
    /**
     * Color explícito de la lupa y del botón de limpiar: sobre una escena de
     * fondo el tono por defecto no se lee.
     */
    iconColor?: string;
};

/**
 * `TextField` con lupa fija y botón de limpiar — Fase 4. La lupa es
 * decorativa (Regla 2: sin `accessibilityLabel`, `Icon` la oculta sola del
 * lector de pantalla); el botón de limpiar solo aparece con texto escrito.
 */
export function SearchField({
    label,
    value,
    onChangeText,
    onClear,
    containerClassName,
    iconColor,
    ...props
}: SearchFieldProps) {
    const { t } = useTranslation();

    return (
        <TextField
            {...props}
            label={label ?? t('common.search')}
            hideLabel
            containerClassName={containerClassName}
            leadingIcon={<Icon name="search" size="sm" color={iconColor} />}
            trailingIcon={
                value.length > 0 ? (
                    <IconButton
                        icon="close-circle"
                        accessibilityLabel={t('common.clearSearch')}
                        size="sm"
                        iconColor={iconColor}
                        onPress={() => (onClear ? onClear() : onChangeText(''))}
                    />
                ) : null
            }
        />
    );
}
