import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { AppBar } from '@/components/ui/app-bar';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FieldError } from '@/components/ui/field-error';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useDuplicates, useMergeBelievers, type DuplicateView } from '@/hooks/use-duplicates';

const EVIDENCE_KEYS = {
    name: 'sync.duplicates.evidenceName',
    phone: 'sync.duplicates.evidencePhone',
    email: 'sync.duplicates.evidenceEmail',
} as const;

const fullName = (person: { firstName: string; lastName: string }): string =>
    `${person.firstName} ${person.lastName}`.trim();

/**
 * Posibles duplicados de la iglesia activa. Solo se sugieren: un nombre parecido o
 * un teléfono compartido no prueban que sea la misma persona (las familias
 * comparten). Fusionar pasa siempre por una confirmación.
 */
export default function DuplicatesScreen() {
    const { t } = useTranslation();
    const bottomPadding = usePageBottomPadding();
    const { data: pairs = [] } = useDuplicates();
    const merge = useMergeBelievers();
    const [selected, setSelected] = useState<DuplicateView | null>(null);

    function fuse(keep: string, drop: string): void {
        merge.mutate(
            { keep, drop },
            { onSuccess: (result) => result !== 'invalid' && setSelected(null) },
        );
    }

    return (
        <View className="flex-1 bg-muted dark:bg-background">
            <AppBar title={t('sync.duplicates.title')} />
            <ScrollView
                contentContainerStyle={{ gap: 20, padding: 22, paddingBottom: bottomPadding }}
            >
                <Text className="text-sm font-sans text-muted-foreground">
                    {t('sync.duplicates.intro')}
                </Text>
                {pairs.length === 0 ? (
                    <EmptyState icon="people-outline" title={t('sync.duplicates.empty')} />
                ) : (
                    <SettingsGroup label={t('sync.duplicates.title')}>
                        {pairs.map((pair) => (
                            <SettingsRow
                                key={`${pair.a}-${pair.b}`}
                                icon="people-outline"
                                title={`${fullName(pair.first)} · ${fullName(pair.second)}`}
                                subtitle={`${t(pair.confidence === 'likely' ? 'sync.duplicates.likely' : 'sync.duplicates.possible')}: ${pair.evidence.map((e) => t(EVIDENCE_KEYS[e])).join(', ')}`}
                                onPress={() => setSelected(pair)}
                            />
                        ))}
                    </SettingsGroup>
                )}
            </ScrollView>
            {selected ? (
                <BottomSheet
                    visible
                    title={t('sync.duplicates.keepTitle')}
                    onClose={() => setSelected(null)}
                >
                    <View className="gap-4 pb-3">
                        <Text className="text-sm font-sans text-muted-foreground">
                            {t('sync.duplicates.keepBody')}
                        </Text>
                        <Button
                            title={t('sync.duplicates.keep', { name: fullName(selected.first) })}
                            size="lg"
                            loading={merge.isPending}
                            onPress={() => fuse(selected.a, selected.b)}
                        />
                        <Button
                            title={t('sync.duplicates.keep', { name: fullName(selected.second) })}
                            variant="secondary"
                            size="lg"
                            loading={merge.isPending}
                            onPress={() => fuse(selected.b, selected.a)}
                        />
                        {merge.data === 'invalid' || merge.isError ? (
                            <FieldError message={t('sync.duplicates.failed')} />
                        ) : null}
                    </View>
                </BottomSheet>
            ) : null}
        </View>
    );
}
