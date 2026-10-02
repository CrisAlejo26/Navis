import type { ListMember } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import { useListMembers, useListMutation } from '@/hooks/use-lists';
import { reorderListMembers } from '@/data/repos/list-members-writes';
import { Button } from '@/components/ui/button';
import { MemberRow } from './member-row';
import { SearchField } from '@/components/ui/search-field';
import { FieldError } from '@/components/ui/field-error';
import { toSearchName } from '@navis/shared';
import { MemberPicker } from './member-picker';
import { MemberActions } from './member-actions';

export function MembersSection({
    id,
    canManage,
    bottom,
}: {
    id: string;
    canManage: boolean;
    bottom: number;
}) {
    const { t } = useTranslation();
    const query = useListMembers(id);
    const members = query.data ?? [];
    const reorder = useListMutation((context, ids: string[]) =>
        reorderListMembers(context, id, ids),
    );
    const [search, setSearch] = useState('');
    const [picker, setPicker] = useState(false);
    const [member, setMember] = useState<ListMember | null>(null);
    function move(one: ListMember, direction: number) {
        const ids = members.map((item) => item.believerId);
        const index = ids.indexOf(one.believerId);
        const target = index + direction;
        if (target < 0 || target >= ids.length || reorder.isPending) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        reorder.mutate(ids);
    }
    return (
        <View className="gap-3 flex-1">
            <View className="gap-3 px-4">
                <SearchField
                    value={search}
                    onChangeText={setSearch}
                    accessibilityLabel={t('lists.searchPeople')}
                    placeholder={t('lists.searchPeople')}
                />
                {canManage ? (
                    <Button
                        title={t('lists.addPeople')}
                        leadingIcon="person-add-outline"
                        onPress={() => setPicker(true)}
                    />
                ) : null}
                {query.isError || reorder.isError ? (
                    <FieldError message={t('errors.generic')} />
                ) : null}
            </View>
            <FlatList
                data={members.filter((one) =>
                    toSearchName(`${one.firstName} ${one.lastName}`).includes(toSearchName(search)),
                )}
                keyExtractor={(one) => one.believerId}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: bottom }}
                ListEmptyComponent={
                    <Text className="p-4 text-muted-foreground">
                        {t(query.isPending ? 'common.loading' : 'lists.emptyList')}
                    </Text>
                }
                renderItem={({ item }) => (
                    <MemberRow
                        member={item}
                        index={members.indexOf(item)}
                        total={members.length}
                        canManage={canManage}
                        busy={reorder.isPending}
                        onEdit={() => setMember(item)}
                        onMove={(direction) => move(item, direction)}
                    />
                )}
            />
            {picker ? <MemberPicker id={id} onClose={() => setPicker(false)} /> : null}
            {member ? (
                <MemberActions id={id} member={member} onClose={() => setMember(null)} />
            ) : null}
        </View>
    );
}
