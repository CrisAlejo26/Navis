import { LOCALE_LABELS, LOCALES, type Locale } from '@pastortools/shared';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { getLocale, setLocale } from '@/lib/i18n';

/** Selector de idioma. Por defecto viene el del dispositivo. */
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? getLocale()) as Locale;

  return (
    <label className="text-muted-foreground inline-flex items-center gap-2 text-sm">
      <Languages size={16} aria-hidden />
      <span className="sr-only">{t('language.label')}</span>
      <select
        value={current}
        onChange={(event) => {
          setLocale(event.target.value as Locale);
        }}
        aria-label={t('language.label')}
        className="bg-card text-foreground h-9 rounded-lg border px-2 text-sm"
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
