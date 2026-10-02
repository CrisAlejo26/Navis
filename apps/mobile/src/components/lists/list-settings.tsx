import type { List } from '@navis/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { deleteList, updateList } from '@/data/repos/lists-repo';
import { useListMutation } from '@/hooks/use-lists';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { ListForm } from './list-form';
import { CoverField } from './cover-field';

export function ListSettings({ list, onClose }: { list: List; onClose: () => void }) {
    const { t } = useTranslation();
    const [edit, setEdit] = useState(false);
    const [confirm, setConfirm] = useState(false);
    const update = useListMutation((context, input: Parameters<typeof updateList>[2]) =>
        updateList(context, list.id, input),
    );
    const remove = useListMutation((context) => deleteList(context, list.id));
    const busy = update.isPending || remove.isPending;
    if (edit)
        return (
            <ListForm list={list} onClose={onClose} onSave={(input) => update.mutateAsync(input)} />
        );
    return (
        <BottomSheet
            visible
            onClose={() => {
                if (!busy) onClose();
            }}
            title={t('lists.edit')}
        >
            <View className="gap-4 pb-3">
                {confirm ? (
                    <>
                        <Text className="text-foreground">{t('lists.localDeleteExplain')}</Text>
                        <Button
                            title={t('lists.delete')}
                            variant="destructive"
                            loading={remove.isPending}
                            onPress={() =>
                                void remove
                                    .mutateAsync(undefined)
                                    .then(() => {
                                        onClose();
                                        router.replace('/lists');
                                    })
                                    .catch(() => undefined)
                            }
                        />
                        <Button
                            title={t('common.cancel')}
                            variant="ghost"
                            disabled={busy}
                            onPress={() => setConfirm(false)}
                        />
                    </>
                ) : (
                    <>
                        <CoverField id={list.id} />
                        <Button
                            title={t('lists.edit')}
                            disabled={busy}
                            onPress={() => setEdit(true)}
                        />
                        <Button
                            title={t(list.isActive ? 'lists.archive' : 'lists.restore')}
                            variant="secondary"
                            loading={update.isPending}
                            onPress={() =>
                                void update
                                    .mutateAsync({ isActive: !list.isActive })
                                    .then(onClose)
                                    .catch(() => undefined)
                            }
                        />
                        <Button
                            title={t('lists.delete')}
                            variant="destructive"
                            disabled={busy}
                            onPress={() => setConfirm(true)}
                        />
                    </>
                )}
                {update.isError || remove.isError ? (
                    <FieldError message={t('errors.generic')} />
                ) : null}
            </View>
        </BottomSheet>
    );
}
