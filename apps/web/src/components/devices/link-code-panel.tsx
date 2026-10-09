import { DEVICE_LINK_TTL_MINUTES, type DeviceLink } from '@navis/shared';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CopyField } from '@/components/devices/copy-field';
import { Button } from '@/components/ui/button';
import { Note } from '@/components/ui/note';
import { getLocale } from '@/lib/i18n';
import { useSecondsLeft } from '@/lib/use-seconds-left';

const TOTAL_SECONDS = DEVICE_LINK_TTL_MINUTES * 60;

/**
 * El código recién generado. La firma de la pantalla es la regla de abajo: una
 * estela que se consume con el tiempo que le queda al código, y que la gente
 * lee sin leer un número. Se anima con `transform` (nunca `width`).
 */
export function LinkCodePanel({
    link,
    onRegenerate,
    isRegenerating,
}: {
    link: DeviceLink;
    onRegenerate: () => void;
    isRegenerating: boolean;
}) {
    const { t } = useTranslation();
    const left = useSecondsLeft(link.expiresAt);
    const expired = left === 0;
    const time = new Intl.DateTimeFormat(getLocale(), { timeStyle: 'short' }).format(
        link.expiresAt,
    );

    return (
        <section
            aria-label={t('sync.codeTitle')}
            className="gap-4 p-5 flex flex-col rounded-xl border bg-card"
        >
            <div aria-hidden className="h-1 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full origin-left rounded-full bg-brand transition-transform duration-1000 ease-linear"
                    style={{
                        transform: `scaleX(${String(expired ? 0 : Math.min(1, left / TOTAL_SECONDS))})`,
                    }}
                />
            </div>
            <p role="status" className="text-sm text-muted-foreground">
                {expired ? t('sync.expired') : t('sync.expiresAt', { time })}
            </p>

            <div className={expired ? 'gap-4 flex flex-col opacity-50' : 'gap-4 flex flex-col'}>
                <CopyField label={t('sync.apiUrlLabel')} value={link.apiUrl} />
                <CopyField label={t('sync.tokenLabel')} value={link.token} mono />
                <p className="text-sm text-muted-foreground">
                    {t('sync.accountLabel')}: <strong>{link.accountEmail}</strong>
                </p>
            </div>

            <Note icon={TriangleAlert} title={t('sync.singleUse')} variant="warning">
                {t('sync.scopeAll')}
            </Note>

            <Button variant="outline" onClick={onRegenerate} isLoading={isRegenerating}>
                {t('sync.newCode')}
            </Button>
        </section>
    );
}
