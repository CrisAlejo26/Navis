import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';
import { toSearchName } from '@navis/shared';
import { useListCandidates, useListMutation } from '@/hooks/use-lists';
import { addListMembers } from '@/data/repos/list-members-writes';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchField } from '@/components/ui/search-field';
import { FieldError } from '@/components/ui/field-error';
import { useSheetBodyMaxHeight } from '@/lib/ui/keyboard';

export function MemberPicker({ id, onClose }: { id: string; onClose: () => void }) {
    const { t } = useTranslation();
    const candidates = useListCandidates(id);
    const add = useListMutation((context, ids: string[]) => addListMembers(context, id, ids));
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const maxHeight = useSheetBodyMaxHeight(0.7);
    const items =
        candidates.data?.filter((one) =>
            toSearchName(`${one.firstName} ${one.lastName}`).includes(toSearchName(search)),
        ) ?? [];
    return (
        <BottomSheet
            visible
            scrollable={false}
            onClose={() => {
                if (!add.isPending) onClose();
            }}
            title={t('lists.addPeople')}
        >
            <View className="gap-3">
                <SearchField
                    value={search}
                    onChangeText={setSearch}
                    accessibilityLabel={t('lists.searchPeople')}
                    placeholder={t('lists.searchPeople')}
                />
                <FlatList
                    style={{ maxHeight: Math.max(120, maxHeight - 180) }}
                    data={items}
                    keyExtractor={(one) => one.id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <Checkbox
                            label={`${item.firstName} ${item.lastName}`}
                            checked={selected.includes(item.id)}
                            disabled={add.isPending}
                            onChange={() =>
                                setSelected((previous) =>
                                    previous.includes(item.id)
                                        ? previous.filter((one) => one !== item.id)
                                        : [...previous, item.id],
                                )
                            }
                        />
                    )}
                />
                {candidates.isError || add.isError ? (
                    <FieldError message={t('errors.generic')} />
                ) : null}
                <Button
                    title={t('lists.addSelected', { count: selected.length })}
                    loading={add.isPending}
                    disabled={!selected.length || candidates.isPending}
                    onPress={() =>
                        void add
                            .mutateAsync(selected)
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            </View>
        </BottomSheet>
    );
}
