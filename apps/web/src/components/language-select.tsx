import { LOCALE_LABELS, LOCALES, type Locale } from '@navis/shared';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Select } from '@/components/ui/select';
import { getLocale, setLocale } from '@/lib/i18n';
import { toast } from '@/lib/toast';

/** Selector de idioma. Por defecto viene el del dispositivo. */
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? getLocale()) as Locale;

  return (
    <span className="gap-2 inline-flex items-center text-muted-foreground">
      <Languages size={16} aria-hidden />
      <Select
        size="sm"
        value={current}
        onChange={(event) => {
          const locale = LOCALES.find((item) => item === event.target.value) ?? current;
          setLocale(locale);
          // El aviso se pide después de cambiar el idioma, así que ya sale en
          // el idioma nuevo, que es lo que se espera al leerlo.
          toast.success(t('language.changed', { language: LOCALE_LABELS[locale] }));
        }}
        aria-label={t('language.label')}
      >
        {LOCALES.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale]}
          </option>
        ))}
      </Select>
    </span>
  );
}
