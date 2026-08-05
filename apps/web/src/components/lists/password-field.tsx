import { generateListPassword, LIST_PASSWORD_MIN_LENGTH } from '@navis/shared';
import { Copy, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/lists/share-link';
import { toast } from '@/lib/toast';

/**
 * La contraseña de un acceso: **nace ya generada** (RFC 0010 D25).
 *
 * Es la opción por defecto y no un botón escondido, y se genera pensando en que
 * alguien la va a leer en voz alta y otro la va a teclear con el pulgar: sin
 * caracteres que se confundan, en tres grupos de cuatro y con `crypto`, nunca
 * con `Math.random`.
 *
 * Quien prefiera escribirla a mano puede, con su mínimo. El botón de volver a
 * tirarla está siempre al lado.
 */
export function PasswordField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const [propia, setPropia] = useState(false);

  return (
    <div className="gap-2 flex flex-col">
      <Input
        name="password"
        label={t('lists.password')}
        value={value}
        readOnly={!propia}
        autoComplete="off"
        minLength={propia ? LIST_PASSWORD_MIN_LENGTH : undefined}
        // Monoespaciada y con los grupos bien separados: es lo que hace que se
        // lea en voz alta sin equivocarse.
        className={propia ? undefined : 'font-mono tracking-[0.12em]'}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      />

      <div className="gap-2 flex flex-wrap items-center">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onChange(generateListPassword());
            setPropia(false);
          }}
        >
          <RefreshCw size={14} aria-hidden />
          {t('lists.regenerate')}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void copyToClipboard(value).then((ok) => {
              if (ok) toast.success(t('lists.copied'));
            });
          }}
        >
          <Copy size={14} aria-hidden />
          {t('lists.copy')}
        </Button>

        {!propia && (
          <button
            type="button"
            onClick={() => {
              setPropia(true);
              onChange('');
            }}
            className="text-xs cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('lists.writeMyOwn')}
          </button>
        )}
      </div>
    </div>
  );
}
