import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { ConflictSheet } from '@/components/sync/conflict-sheet';
import { AppBar } from '@/components/ui/app-bar';
import { EmptyState } from '@/components/ui/empty-state';
import { SettingsGroup } from '@/components/settings/settings-group';
import { SettingsRow } from '@/components/settings/settings-row';
import { usePageBottomPadding } from '@/hooks/use-page-bottom-padding';
import { useOpenConflicts, type ConflictView } from '@/hooks/use-sync-conflicts';
import type { ConflictKind } from '@/lib/sync/conflicts-store';

const KIND_KEYS = {
    fields: 'sync.conflicts.kindFields',
    'remote-deleted': 'sync.conflicts.kindRemoteDeleted',
    'local-deleted': 'sync.conflicts.kindLocalDeleted',
} as const satisfies Record<ConflictKind, string>;

/**
 * El centro de conflictos: todo lo que tú y otra persona cambiasteis a la vez, de
 * todas las iglesias y módulos. Nada se ha perdido ni sobrescrito mientras
 * espera: cada elemento conserva las dos versiones hasta que decides.
 */
export default function ConflictsScreen() {
    const { t } = useTranslation();
    const bottomPadding = usePageBottomPadding();
    const { data: conflicts = [] } = useOpenConflicts();
    const [selected, setSelected] = useState<ConflictView | null>(null);

    return (
        <View className="flex-1 bg-muted dark:bg-background">
            <AppBar title={t('sync.conflicts.title')} />
            <ScrollView
                contentContainerStyle={{ gap: 20, padding: 22, paddingBottom: bottomPadding }}
            >
                <Text className="text-sm font-sans text-muted-foreground">
                    {t('sync.conflicts.intro')}
                </Text>
                {conflicts.length === 0 ? (
                    <EmptyState icon="checkmark-circle-outline" title={t('sync.conflicts.empty')} />
                ) : (
                    <SettingsGroup label={t('sync.conflicts.title')}>
                        {conflicts.map((conflict) => (
                            <SettingsRow
                                key={conflict.id}
                                icon="git-compare-outline"
                                title={conflict.title}
                                subtitle={t(KIND_KEYS[conflict.kind])}
                                onPress={() => setSelected(conflict)}
                            />
                        ))}
                    </SettingsGroup>
                )}
            </ScrollView>
            {selected ? (
                <ConflictSheet conflict={selected} onClose={() => setSelected(null)} />
            ) : null}
        </View>
    );
}
