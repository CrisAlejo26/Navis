import type { EntryKind } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Chip } from '@/components/ui/chip';
import { JOURNAL_KINDS } from './journal-kinds';
import { kindColor, useJournalTheme } from './journal-theme';

export function JournalKindChip({
    kind,
    selected,
    onPress,
}: {
    kind: EntryKind;
    selected?: boolean;
    onPress: () => void;
}) {
    const { t } = useTranslation(),
        p = useJournalTheme();
    return (
        <Chip
            label={t(JOURNAL_KINDS[kind].label)}
            icon={JOURNAL_KINDS[kind].icon}
            color={kindColor(kind, p)}
            selected={selected}
            onPress={onPress}
        />
    );
}
