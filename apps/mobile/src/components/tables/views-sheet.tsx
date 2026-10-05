import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import type { CustomTableWithColumns, CustomTableView, RowFilter } from '@navis/shared';
import { deleteView } from '@/data/repos/table-views';
import { useTableMutation } from '@/hooks/use-tables';
import { ConfirmationSheet } from './confirmation-sheet';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { ViewForm } from './view-form';
import { ViewOption } from './view-option';

export function ViewsSheet({
    table,
    views,
    active,
    initialFilters,
    canManage,
    onSelect,
    onRemove,
    onClose,
}: {
    table: CustomTableWithColumns;
    views: CustomTableView[];
    active: string;
    initialFilters?: RowFilter[];
    canManage: boolean;
    onSelect: (id: string) => void;
    onRemove: (id: string) => Promise<void>;
    onClose: () => void;
}) {
    const { t } = useTranslation(),
        [form, setForm] = useState<CustomTableView | 'new' | null>(null);
    const [deleting, setDeleting] = useState<CustomTableView | null>(null);
    const remove = useTableMutation((scope, id: string) => deleteView(scope, table.id, id));
    if (deleting)
        return (
            <ConfirmationSheet
                title={t('tables.deleteView')}
                subject={deleting.name}
                description={t('tables.deleteViewExplain')}
                confirmLabel={t('common.delete')}
                busy={remove.isPending}
                failed={remove.isError}
                onCancel={() => setDeleting(null)}
                onConfirm={() =>
                    void remove
                        .mutateAsync(deleting.id)
                        .then(() => onRemove(deleting.id))
                        .then(() => setDeleting(null))
                        .catch(() => undefined)
                }
            />
        );
    if (form)
        return (
            <ViewForm
                table={table}
                view={form === 'new' ? undefined : form}
                initialFilters={initialFilters}
                onClose={() => setForm(null)}
            />
        );
    return (
        <BottomSheet visible onClose={onClose} title={t('tables.mobile.views')}>
            <View className="gap-3">
                <ViewOption
                    name={t('tables.mobile.cardsView')}
                    kind="grid"
                    selected={active === 'grid'}
                    onSelect={() => onSelect('grid')}
                />
                {views.map((view) => (
                    <ViewOption
                        key={view.id}
                        name={view.name}
                        kind={view.type}
                        selected={active === view.id}
                        onSelect={() => onSelect(view.id)}
                        onEdit={canManage ? () => setForm(view) : undefined}
                        onDelete={canManage ? () => setDeleting(view) : undefined}
                    />
                ))}
                {remove.isError ? <FieldError message={t('tables.saveFailed')} /> : null}
                {canManage ? (
                    <Button
                        leadingIcon="add"
                        title={t('tables.newView')}
                        onPress={() => setForm('new')}
                    />
                ) : null}
            </View>
        </BottomSheet>
    );
}
