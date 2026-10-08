import { ENTRY_KINDS } from '@navis/shared';
import { FONT_FAMILIES } from '@navis/theme';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TextField } from '@/components/ui/text-field';
import { DatePicker } from '@/components/ui/date-picker';
import { JournalKindChip } from './journal-kind-chip';
import { JournalSection } from './journal-section';
import type { useJournalForm } from '@/hooks/use-journal-form';

export function JournalFormFields({ form: f }: { form: ReturnType<typeof useJournalForm> }) {
    const { t } = useTranslation();
    return (
        <View style={{ gap: 24 }}>
            <TextField
                testID="journal-title"
                label={t('journal.titleField')}
                error={f.fieldErrors.title}
                value={f.title}
                onChangeText={f.setTitle}
                maxLength={200}
                placeholder={t('journal.titlePlaceholder')}
                autoFocus
                multiline
                style={{
                    fontSize: 26,
                    lineHeight: 36,
                    fontFamily: FONT_FAMILIES.sansSemiBold.native,
                }}
            />
            <View style={{ gap: 8 }}>
                <Text className="text-sm font-sans-medium text-foreground">
                    {t('journal.kindField')}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {ENTRY_KINDS.map((kind) => (
                        <JournalKindChip
                            key={kind}
                            kind={kind}
                            selected={f.kind === kind}
                            onPress={() => f.setKind(kind)}
                        />
                    ))}
                </View>
            </View>
            <DatePicker
                label={t('journal.occurredAtField')}
                error={f.fieldErrors.date}
                value={f.day}
                onChange={f.setDay}
                placeholder={t('journal.occurredAtField')}
            />
            <TextField
                testID="journal-annotation"
                label={t('journal.annotationField')}
                error={f.fieldErrors.annotation}
                className="min-h-40"
                value={f.annotation}
                onChangeText={f.setAnnotation}
                multiline
                maxLength={8000}
                placeholder={t('journal.annotationPlaceholder')}
            />
            <JournalSection
                title={t('journal.learnedField')}
                icon="bulb-outline"
                open={f.showLearned}
                onToggle={() => f.setShowLearned(!f.showLearned)}
            >
                <TextField
                    label={t('journal.learnedField')}
                    error={f.fieldErrors.learned}
                    value={f.learned}
                    onChangeText={f.setLearned}
                    multiline
                    maxLength={8000}
                    placeholder={t('journal.learnedPlaceholder')}
                />
            </JournalSection>
        </View>
    );
}
