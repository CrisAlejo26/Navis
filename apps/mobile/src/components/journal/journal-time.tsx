import { useTranslation } from 'react-i18next';
import { TimePicker } from '@/components/ui/time-picker';
export function JournalTime({
    value,
    onChange,
}: {
    value: string;
    onChange: (value: string) => void;
}) {
    const { t } = useTranslation();
    return <TimePicker value={value} onChange={onChange} label={t('journal.mobile.time')} />;
}
