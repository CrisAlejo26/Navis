import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { RadioGroup } from '@/components/ui/radio-group';
import { TextField } from '@/components/ui/text-field';
import { useResolveConflict, type ConflictView } from '@/hooks/use-sync-conflicts';
import { humanizeField } from '@/lib/sync/describe-entity';
import type { Decision, FieldChoice } from '@/lib/sync/resolve-conflict';

type Pick = 'local' | 'remote' | 'custom' | 'none';

const show = (value: string | number | null | undefined): string =>
    value === null || value === undefined || value === '' ? '—' : String(value);

/** Un campo en conflicto: qué hay aquí, qué hay en el servidor, o un valor combinado. */
function FieldDecision({
    field,
    conflict,
    pick,
    custom,
    onPick,
    onCustom,
}: {
    field: string;
    conflict: ConflictView;
    pick: Pick;
    custom: string;
    onPick: (pick: Pick) => void;
    onCustom: (text: string) => void;
}) {
    const { t } = useTranslation();
    return (
        <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-foreground capitalize">
                {humanizeField(field)}
            </Text>
            <RadioGroup<Pick>
                value={pick}
                onChange={onPick}
                options={[
                    {
                        value: 'local',
                        label: t('sync.conflicts.thisPhone'),
                        description: show(conflict.local?.[field]),
                    },
                    {
                        value: 'remote',
                        label: t('sync.conflicts.server'),
                        description: show(conflict.remote?.[field]),
                    },
                    { value: 'custom', label: t('sync.conflicts.custom') },
                ]}
            />
            {pick === 'custom' ? (
                <TextField
                    label={t('sync.conflicts.customLabel')}
                    value={custom}
                    onChangeText={onCustom}
                    multiline
                />
            ) : null}
        </View>
    );
}

function FieldsBody({ conflict, onDecide, busy }: BodyProps) {
    const { t } = useTranslation();
    const [picks, setPicks] = useState<Record<string, Pick>>({});
    const [custom, setCustom] = useState<Record<string, string>>({});
    const ready = conflict.fields.every(
        (f) =>
            picks[f] && picks[f] !== 'none' && (picks[f] !== 'custom' || (custom[f] ?? '') !== ''),
    );

    function decide(): void {
        const choices: Record<string, FieldChoice> = {};
        for (const field of conflict.fields) {
            choices[field] =
                picks[field] === 'custom'
                    ? { custom: custom[field] ?? '' }
                    : (picks[field] as FieldChoice);
        }
        onDecide({ kind: 'fields', choices });
    }

    return (
        <View className="gap-5">
            <Text className="text-sm font-sans text-muted-foreground">
                {t('sync.conflicts.fieldsHint')}
            </Text>
            {conflict.fields.map((field) => (
                <FieldDecision
                    key={field}
                    field={field}
                    conflict={conflict}
                    pick={picks[field] ?? 'none'}
                    custom={custom[field] ?? ''}
                    onPick={(pick) => setPicks((all) => ({ ...all, [field]: pick }))}
                    onCustom={(text) => setCustom((all) => ({ ...all, [field]: text }))}
                />
            ))}
            <Button
                title={t('sync.conflicts.resolve')}
                size="lg"
                disabled={!ready}
                loading={busy}
                onPress={decide}
            />
        </View>
    );
}

function DeletedBody({ conflict, onDecide, busy }: BodyProps) {
    const { t } = useTranslation();
    const remoteDeleted = conflict.kind === 'remote-deleted';
    return (
        <View className="gap-4">
            <Text className="text-sm font-sans text-muted-foreground">
                {remoteDeleted
                    ? t('sync.conflicts.remoteDeletedHint')
                    : t('sync.conflicts.localDeletedHint')}
            </Text>
            <Button
                title={
                    remoteDeleted
                        ? t('sync.conflicts.acceptDeletion')
                        : t('sync.conflicts.keepRemote')
                }
                variant="secondary"
                size="lg"
                loading={busy}
                onPress={() =>
                    onDecide(
                        remoteDeleted
                            ? { kind: 'remote-deleted', choice: 'accept-deletion' }
                            : { kind: 'local-deleted', choice: 'keep-remote' },
                    )
                }
            />
            <Button
                title={
                    remoteDeleted
                        ? t('sync.conflicts.keepMine')
                        : t('sync.conflicts.confirmDeletion')
                }
                size="lg"
                loading={busy}
                onPress={() =>
                    onDecide(
                        remoteDeleted
                            ? { kind: 'remote-deleted', choice: 'keep-mine' }
                            : { kind: 'local-deleted', choice: 'delete' },
                    )
                }
            />
        </View>
    );
}

interface BodyProps {
    conflict: ConflictView;
    onDecide: (decision: Decision) => void;
    busy: boolean;
}

/** La hoja donde una persona decide un conflicto: nada se aplica hasta que lo confirma. */
export function ConflictSheet({
    conflict,
    onClose,
}: {
    conflict: ConflictView;
    onClose: () => void;
}) {
    const { t } = useTranslation();
    const resolve = useResolveConflict();

    function decide(decision: Decision): void {
        resolve.mutate(
            { id: conflict.id, decision },
            { onSuccess: (outcome) => outcome === 'resolved' && onClose() },
        );
    }
    const failed = resolve.isError || (resolve.data !== undefined && resolve.data !== 'resolved');
    const Body = conflict.kind === 'fields' ? FieldsBody : DeletedBody;

    return (
        <BottomSheet visible title={conflict.title} onClose={onClose}>
            <View className="gap-4 pb-3">
                <Body conflict={conflict} onDecide={decide} busy={resolve.isPending} />
                {failed ? <FieldError message={t('sync.conflicts.failed')} /> : null}
            </View>
        </BottomSheet>
    );
}
