import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';
import type { CustomTableWithColumns, CustomTableView } from '@navis/shared';
import type { ViewState } from '@/lib/tables/view-state';
import { useTableMutation } from '@/hooks/use-tables';
import { updateView } from '@/data/repos/table-views';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';

export function TableToolbar({
    table,
    view,
    state,
    onChange,
    onPanel,
    canManage,
}: {
    table: CustomTableWithColumns;
    view?: CustomTableView;
    state: ViewState;
    onChange: (patch: Partial<ViewState>) => void;
    onPanel: (panel: 'views' | 'query' | 'presentation') => void;
    canManage: boolean;
}) {
    const { t } = useTranslation();
    const save = useTableMutation((scope, _: void) =>
        updateView(scope, table.id, view?.id ?? '', {
            filters: state.query.filters,
            sortBy: state.query.sort ?? null,
            sortOrder: state.query.order,
        }),
    );
    const dirty =
        view &&
        (JSON.stringify(view.filters) !== JSON.stringify(state.query.filters ?? []) ||
            (view.sortBy ?? undefined) !== state.query.sort ||
            view.sortOrder !== state.query.order);
    return (
        <View className="px-4 pt-4 pb-3 gap-2">
            <Button
                variant="secondary"
                title={view?.name ?? t('tables.mobile.cardsView')}
                trailingIcon="chevron-down"
                onPress={() => onPanel('views')}
            />
            <SearchField
                placeholder={t('tables.search')}
                value={state.query.search ?? ''}
                onChangeText={(search) =>
                    onChange({ query: { ...state.query, search }, scroll: 0 })
                }
            />
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-2"
            >
                <Button
                    variant="secondary"
                    leadingIcon="funnel-outline"
                    title={t('tables.filters.addWithCount', {
                        count: state.query.filters?.length ?? 0,
                    })}
                    onPress={() => onPanel('query')}
                />
                <Button
                    variant="secondary"
                    leadingIcon="swap-vertical-outline"
                    title={t('tables.sortBy')}
                    onPress={() => onPanel('query')}
                />
                <Button
                    variant="secondary"
                    title={t('tables.columns')}
                    onPress={() => onPanel('presentation')}
                />
            </ScrollView>
            {!!state.query.filters?.length && (
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {state.query.filters?.map((filter) => (
                        <Button
                            key={filter.columnKey}
                            variant="link"
                            title={
                                (table.columns.find((column) => column.key === filter.columnKey)
                                    ?.label ?? '') + ' ×'
                            }
                            onPress={() =>
                                onChange({
                                    query: {
                                        ...state.query,
                                        filters: state.query.filters?.filter(
                                            (one) => one !== filter,
                                        ),
                                    },
                                    scroll: 0,
                                })
                            }
                        />
                    ))}
                </ScrollView>
            )}
            {dirty ? (
                <Text className="font-sans text-muted-foreground">
                    {t('tables.mobile.unsaved')}
                </Text>
            ) : null}
            {dirty && canManage ? (
                <Button
                    variant="link"
                    title={t('tables.filters.updateView')}
                    loading={save.isPending}
                    onPress={() => save.mutate()}
                />
            ) : null}
            {save.isError ? (
                <Text className="font-sans text-destructive">{t('tables.saveFailed')}</Text>
            ) : null}
        </View>
    );
}
