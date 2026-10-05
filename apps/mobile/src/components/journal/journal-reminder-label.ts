import { i18n, getLocale } from '@/lib/i18n';
import { formatMoment } from '@/lib/format';

export function journalReminderLabel(iso: string, now = new Date()) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return formatMoment(iso);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day =
        date.toDateString() === now.toDateString()
            ? i18n.t('common.today')
            : date.toDateString() === tomorrow.toDateString()
              ? i18n.t('journal.mobile.tomorrow')
              : null;
    const time = new Intl.DateTimeFormat(getLocale(), {
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
    return day ? `${day}, ${time}` : formatMoment(iso);
}
