import { useTranslation } from 'react-i18next';

/**
 * Sin conversación abierta, en escritorio (junto a la lista, que ya tiene su
 * propio estado vacío si no hay ninguna). Sin ilustración ni mascota: una
 * línea fina, como un horizonte, y el texto invita a escribir a alguien (RFC
 * 0016 §5).
 */
export function ConversationEmptyPage() {
  const { t } = useTranslation();

  return (
    <div className="gap-3 flex h-full flex-col items-center justify-center text-center">
      <span aria-hidden className="mb-2 w-16 h-px bg-border" />
      <p className="text-sm text-muted-foreground">{t('communications.startOne')}</p>
    </div>
  );
}
