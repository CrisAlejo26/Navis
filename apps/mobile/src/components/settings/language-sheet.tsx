import { LOCALE_LABELS, LOCALES, type Locale } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Icon } from '@/components/ui/icon';
import { ListRow } from '@/components/ui/list-row';
import { getLocale, setLocale } from '@/lib/i18n';

interface LanguageSheetProps {
    visible: boolean;
    onClose: () => void;
}

/** Los seis idiomas, cada uno en el suyo, en una hoja: el selector en línea ocupaba media pantalla. */
export function LanguageSheet({ visible, onClose }: LanguageSheetProps) {
    const { t, i18n } = useTranslation();
    const current = (i18n.resolvedLanguage ?? getLocale()) as Locale;

    return (
        <BottomSheet visible={visible} onClose={onClose} title={t('language.label')}>
            {LOCALES.map((locale) => (
                <ListRow
                    key={locale}
                    title={LOCALE_LABELS[locale]}
                    trailing={
                        locale === current ? <Icon name="checkmark" tone="primary" /> : undefined
                    }
                    showChevron={false}
                    accessibilityLabel={LOCALE_LABELS[locale]}
                    onPress={() => {
                        void setLocale(locale);
                        onClose();
                    }}
                />
            ))}
        </BottomSheet>
    );
}
