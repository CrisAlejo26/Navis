import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { IconButton } from '@/components/ui/icon-button';
import { TextField, type TextFieldProps } from '@/components/ui/text-field';

type PasswordFieldProps = Omit<TextFieldProps, 'secureTextEntry' | 'leadingIcon' | 'trailingIcon'>;

/** `TextField` con el icono de mostrar/ocultar — Fase 4. Reutiliza las claves
 * de `auth.*` que ya traducen ese mismo botón en la web. */
export function PasswordField(props: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      secureTextEntry={!visible}
      trailingIcon={
        <IconButton
          icon={visible ? 'eye-off' : 'eye'}
          accessibilityLabel={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          size="sm"
          onPress={() => setVisible((current) => !current)}
        />
      }
    />
  );
}
