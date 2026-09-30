import { LOCALE_LABELS, type Locale } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSheet } from '@/components/settings/language-sheet';
import { NotificationsRow } from '@/components/settings/notifications-row';
import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { getLocale } from '@/lib/i18n';

/** Lo que solo cambia en este teléfono: los avisos y el idioma, en una hoja. */
export function PreferencesGroup() {
    const { t, i18n } = useTranslation();
    const [languageOpen, setLanguageOpen] = useState(false);
    const locale = (i18n.resolvedLanguage ?? getLocale()) as Locale;

    // La hoja va fuera del grupo: dentro contaría como una fila más y pintaría su filete.
    return (
        <>
            <SettingsGroup label={t('settings.preferences')}>
                <NotificationsRow />
                <SettingsRow
                    icon="language-outline"
                    title={t('language.label')}
                    value={LOCALE_LABELS[locale]}
                    onPress={() => setLanguageOpen(true)}
                />
            </SettingsGroup>
            <LanguageSheet visible={languageOpen} onClose={() => setLanguageOpen(false)} />
        </>
    );
}
