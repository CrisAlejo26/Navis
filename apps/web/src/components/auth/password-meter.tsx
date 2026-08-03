import { passwordStrength } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * Medidor de la contraseña, con los mismos criterios que valida el esquema de
 * `@navis/shared`. Es una pista, no un veredicto: quien acepta o rechaza es la
 * validación del formulario.
 *
 * El color no informa solo (Regla 3): al lado va siempre la palabra.
 */
const LEVELS = [
  { label: 'auth.passwordWeak', bar: 'bg-destructive', text: 'text-destructive' },
  { label: 'auth.passwordMedium', bar: 'bg-warning', text: 'text-warning' },
  { label: 'auth.passwordStrong', bar: 'bg-success', text: 'text-success' },
] as const;

export function PasswordMeter({ value }: { value: string }) {
  const { t } = useTranslation();
  const score = passwordStrength(value);

  // Aparece con la primera tecla, no al alcanzar un umbral: la respuesta
  // inmediata es justo lo que hace útil el medidor.
  if (!value) return null;

  const level = LEVELS[score >= 4 ? 2 : score >= 3 ? 1 : 0];

  return (
    <div className="gap-2 flex items-center">
      <span className="gap-1 flex flex-1" role="presentation">
        {[1, 2, 3, 4].map((segment) => (
          <span
            key={segment}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              segment <= score ? level.bar : 'bg-muted',
            )}
          />
        ))}
      </span>
      <span className={cn('text-xs font-medium', level.text)}>
        <span className="sr-only">{t('auth.passwordStrength')}: </span>
        {t(level.label)}
      </span>
    </div>
  );
}
