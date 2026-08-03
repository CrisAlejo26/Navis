import { Eye, EyeOff } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

/**
 * Campo de contraseña con el interruptor de ver/ocultar. Se puede escribir mal
 * una contraseña que no se ve, y a ciegas no hay forma de saberlo hasta que la
 * validación dice que no.
 */
export function PasswordInput(props: Omit<ComponentProps<typeof Input>, 'type' | 'trailing'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  const label = visible ? t('auth.hidePassword') : t('auth.showPassword');

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => {
            setVisible((current) => !current);
          }}
          aria-label={label}
          aria-pressed={visible}
          title={label}
          className="h-9 w-9 inline-flex cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 hover:text-foreground"
        >
          <Icon size={17} aria-hidden />
        </button>
      }
    />
  );
}
