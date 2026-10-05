import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { tableBelieverCandidates, addTableBelievers } from '@/data/repos/table-believers';
import { tablesKey, useTableContext, useTableMutation } from '@/hooks/use-tables';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { SearchField } from '@/components/ui/search-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';

export function BelieversPicker({ id, onClose }: { id: string; onClose: () => void }) {
    const { t } = useTranslation(),
        { context } = useTableContext(),
        [text, setText] = useState(''),
        [selected, setSelected] = useState<string[]>([]);
    const search = useDebouncedValue(text, 250);
    const candidates = useInfiniteQuery({
        queryKey: [...tablesKey(context), id, 'candidates', search],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => tableBelieverCandidates(context, id, search, pageParam),
        getNextPageParam: (last, pages) => (last.length === 20 ? pages.length + 1 : undefined),
    });
    const add = useTableMutation((scope, _: void) =>
        addTableBelievers(scope, id, { believerIds: selected }),
    );
    return (
        <BottomSheet visible onClose={onClose} title={t('tables.addBelievers')}>
            <View className="gap-3">
                <SearchField placeholder={t('tables.search')} value={text} onChangeText={setText} />
                {candidates.data?.pages.flat().map((person) => (
                    <Checkbox
                        key={person.id}
                        label={person.name}
                        description={person.linked ? t('tables.alreadyInTable') : undefined}
                        checked={Boolean(person.linked) || selected.includes(person.id)}
                        disabled={
                            Boolean(person.linked) ||
                            (selected.length >= 200 && !selected.includes(person.id))
                        }
                        onChange={(checked) =>
                            setSelected(
                                checked
                                    ? [...selected, person.id]
                                    : selected.filter((id) => id !== person.id),
                            )
                        }
                    />
                ))}
                {candidates.hasNextPage ? (
                    <Button
                        variant="secondary"
                        title={t('tables.loadMore')}
                        loading={candidates.isFetchingNextPage}
                        onPress={() => void candidates.fetchNextPage()}
                    />
                ) : null}
                {candidates.isError ? (
                    <Button title={t('common.retry')} onPress={() => void candidates.refetch()} />
                ) : null}
                {add.isError ? <FieldError message={t('tables.saveFailed')} /> : null}
                <Button
                    title={t('tables.addSelected', { count: selected.length })}
                    disabled={!selected.length}
                    loading={add.isPending}
                    onPress={() =>
                        void add
                            .mutateAsync()
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            </View>
        </BottomSheet>
    );
}
