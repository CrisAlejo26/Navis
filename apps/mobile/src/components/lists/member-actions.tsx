import type { ListMember } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useListMutation } from '@/hooks/use-lists';
import { updateMemberNote, removeListMember } from '@/data/repos/list-members-writes';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { FieldError } from '@/components/ui/field-error';

export function MemberActions({
    id,
    member,
    onClose,
}: {
    id: string;
    member: ListMember;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const name = `${member.firstName} ${member.lastName}`;
    const [note, setNote] = useState(member.note ?? '');
    const save = useListMutation((context, value: string) =>
        updateMemberNote(context, id, member.believerId, value),
    );
    const remove = useListMutation((context) => removeListMember(context, id, member.believerId));
    const busy = save.isPending || remove.isPending;
    return (
        <BottomSheet
            visible
            onClose={() => {
                if (!busy) onClose();
            }}
            title={name}
        >
            <View className="gap-4 pb-3">
                <TextField
                    label={t('lists.noteFor', { name })}
                    value={note}
                    onChangeText={setNote}
                    maxLength={120}
                    multiline
                    editable={!busy}
                />
                {save.isError || remove.isError ? (
                    <FieldError message={t('errors.generic')} />
                ) : null}
                <Button
                    title={t('common.save')}
                    disabled={busy}
                    loading={save.isPending}
                    onPress={() =>
                        void save
                            .mutateAsync(note)
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
                <Button
                    variant="destructive"
                    title={t('lists.removeMember', { name })}
                    disabled={busy}
                    loading={remove.isPending}
                    onPress={() =>
                        void remove
                            .mutateAsync(undefined)
                            .then(onClose)
                            .catch(() => undefined)
                    }
                />
            </View>
        </BottomSheet>
    );
}
