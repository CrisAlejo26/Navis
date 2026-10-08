import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
export function JournalCardSelection({
    selected,
    busy,
    title,
    onSelect,
}: {
    selected?: boolean;
    busy: boolean;
    title: string;
    onSelect: () => void;
}) {
    const { t } = useTranslation();
    return (
        <Checkbox
            compact
            checked={Boolean(selected)}
            disabled={busy}
            label={t('journal.selectOne', { title })}
            onChange={onSelect}
        />
    );
}
