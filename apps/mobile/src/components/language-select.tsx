import { LOCALE_LABELS, LOCALES, type Locale } from '@fidus/shared';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/cn';
import { getLocale, setLocale } from '@/lib/i18n';

/**
 * Selector de idioma. Se dibuja como una fila de pastillas en vez de un
 * `<select>`: React Native no tiene desplegable nativo multiplataforma y son
 * solo seis opciones.
 */
export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const current = (i18n.resolvedLanguage ?? getLocale()) as Locale;

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={t('language.label')}>
      <View className="gap-2 flex-row flex-wrap">
        {LOCALES.map((locale) => {
          const selected = locale === current;
          return (
            <Pressable
              key={locale}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => {
                void setLocale(locale);
              }}
              className={cn(
                'px-3 py-1.5 rounded-full border border-border',
                selected ? 'border-primary bg-primary' : 'bg-card',
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  selected ? 'text-primary-foreground' : 'text-muted-foreground',
                )}
              >
                {LOCALE_LABELS[locale]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
