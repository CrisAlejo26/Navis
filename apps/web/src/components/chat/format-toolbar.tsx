import { Bold, Code, Italic, Strikethrough } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { COLOR_TOKENS, type ColorToken } from '@/lib/chat/message-format';
import { cn } from '@/lib/cn';

const COLOR_DOT: Record<ColorToken, string> = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  accent: 'bg-accent',
};

const BUTTON =
  'h-8 w-8 inline-flex cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:outline-none';

/**
 * Negrita, cursiva, tachado, código y los cinco colores de token, aplicados
 * a lo que esté seleccionado en el compositor (RFC 0019 §1). Va **dentro**
 * del compositor, como la vista previa de responder/editar, no en un
 * popover flotante: en un teclado táctil un popover se recorta detrás del
 * teclado del sistema.
 */
export function FormatToolbar({
  onWrap,
  onColor,
}: {
  onWrap: (marker: string) => void;
  onColor: (token: ColorToken) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-1.5 mb-2 gap-1 flex items-center rounded-lg border bg-muted/40">
      <button
        type="button"
        aria-label={t('communications.formatBold')}
        onClick={() => onWrap('*')}
        className={BUTTON}
      >
        <Bold size={15} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('communications.formatItalic')}
        onClick={() => onWrap('_')}
        className={BUTTON}
      >
        <Italic size={15} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('communications.formatStrikethrough')}
        onClick={() => onWrap('~')}
        className={BUTTON}
      >
        <Strikethrough size={15} aria-hidden />
      </button>
      <button
        type="button"
        aria-label={t('communications.formatCode')}
        onClick={() => onWrap('`')}
        className={BUTTON}
      >
        <Code size={15} aria-hidden />
      </button>

      <span aria-hidden className="mx-1 h-5 w-px bg-border" />

      {COLOR_TOKENS.map((token) => (
        <button
          key={token}
          type="button"
          aria-label={`${t('communications.formatColor')}: ${t(`communications.colorNames.${token}`)}`}
          onClick={() => onColor(token)}
          className={BUTTON}
        >
          <span aria-hidden className={cn('h-4 w-4 rounded-full', COLOR_DOT[token])} />
        </button>
      ))}
    </div>
  );
}
