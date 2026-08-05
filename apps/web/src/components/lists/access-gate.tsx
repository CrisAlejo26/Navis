import { ApiError, useEnterPublicList } from '@navis/api-client';
import { LIST_GATE_PLACEHOLDERS, type PublicListGate } from '@navis/shared';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PublicBand } from '@/components/lists/public-band';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { accentVars } from '@/lib/accents';
import { publicApi } from '@/lib/lists/public-api';

/**
 * **La puerta** (RFC 0010 §8.6, D38).
 *
 * Es **esa misma página con los nombres tapados**, y esa es toda la idea: la
 * banda de color se queda igual, y donde iría el pase de lista van los ordinales
 * sin nombre y barras apagadas. **No dice cuántas personas hay** —las barras son
 * siempre seis— porque el número también es un dato.
 *
 * Que no tenga firma propia es deliberado: es lo que la salva de ser «la tarjeta
 * centrada y sola sobre un fondo vacío», que la Regla 9 §2 nombra como el
 * formulario de acceso de todo el mundo.
 */
export function AccessGate({ gate, token }: { gate: PublicListGate; token: string }) {
  const { t } = useTranslation();
  const enter = useEnterPublicList(publicApi, token);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    enter.mutate({ username: username.trim().toLowerCase(), password });
  };

  /**
   * Los tres mensajes de D26. El 403 se distingue a propósito: quien tiene una
   * llave legítima y se equivoca de enlace lee «este acceso no incluye esta
   * lista» en vez de teclear diez veces la contraseña buena.
   */
  const mensaje = (error: Error): string => {
    if (!(error instanceof ApiError)) return t('errors.generic');
    if (error.status === 403) return t('lists.noGrant');
    if (error.status === 429) {
      return t('lists.tooManyTries', { minutes: minutesLeft(error.body?.data) });
    }

    return t('lists.badCredentials');
  };

  return (
    <>
      <PublicBand churchName={gate.churchName} name={gate.name} accent={gate.accent} />

      <main
        style={accentVars(gate.accent)}
        className="px-6 py-10 sm:px-10 max-w-3xl mx-auto w-full"
      >
        <form onSubmit={submit} className="gap-3 max-w-sm flex flex-col" noValidate>
          <p className="text-sm text-muted-foreground">{t('lists.gateHint')}</p>

          <Input
            name="username"
            label={t('lists.username')}
            value={username}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoComplete="username"
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />

          <PasswordInput
            name="password"
            label={t('lists.password')}
            value={password}
            autoComplete="current-password"
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />

          {enter.error && (
            <p role="alert" className="gap-1.5 text-sm flex items-start text-destructive">
              <AlertCircle size={15} aria-hidden className="mt-0.5 shrink-0" />
              {mensaje(enter.error)}
            </p>
          )}

          <Button type="submit" size="lg" isLoading={enter.isPending}>
            {t('lists.enter')}
          </Button>
        </form>

        {/* Se ve que hay algo y no se ve qué. Siempre seis, no las que haya. */}
        <ol aria-hidden className="gap-1 mt-10 flex flex-col">
          {Array.from({ length: LIST_GATE_PLACEHOLDERS }, (_, index) => (
            <li key={index} className="gap-4 py-2.5 flex items-center border-b border-border/60">
              <span className="w-12 text-3xl font-semibold shrink-0 text-right text-[var(--acento)]/25 tabular-nums">
                {index + 1}
              </span>
              <span
                className="h-4 rounded-full bg-muted"
                style={{ width: `${String(40 + ((index * 13) % 35))}%` }}
              />
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}

/** Lo que trae el 429, comprobado: viene de fuera y no se declara y ya (Regla 10). */
function minutesLeft(data: unknown): number {
  const ms =
    data &&
    typeof data === 'object' &&
    'retryAfterMs' in data &&
    typeof data.retryAfterMs === 'number'
      ? data.retryAfterMs
      : 0;

  return Math.max(1, Math.ceil(ms / 60_000));
}
