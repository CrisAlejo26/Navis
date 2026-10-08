import { proposeListUsername } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { TextField } from '@/components/ui/text-field';
import { PasswordField } from '@/components/ui/password-field';
import { Button } from '@/components/ui/button';
import { useViewerCandidates } from '@/hooks/use-list-viewers';
import { newViewerPassword } from '@/lib/lists/viewer-password';

export interface ViewerDraft {
    kind: 'believer' | 'group';
    believerId: string | null;
    label: string;
    username: string;
    password: string;
}
export function ViewerFormFields({
    draft,
    onChange,
    disabled,
}: {
    draft: ViewerDraft;
    onChange: (draft: ViewerDraft) => void;
    disabled: boolean;
}) {
    const { t } = useTranslation();
    const people = useViewerCandidates();
    const set = (patch: Partial<ViewerDraft>) => onChange({ ...draft, ...patch });
    return (
        <View className="gap-3">
            <SegmentedControl
                value={draft.kind}
                onChange={(kind) => {
                    if (!disabled) set({ kind, believerId: null });
                }}
                options={[
                    { value: 'believer', label: t('lists.forBeliever') },
                    { value: 'group', label: t('lists.forGroup') },
                ]}
            />
            {draft.kind === 'believer' ? (
                <Select
                    label={t('lists.forBeliever')}
                    placeholder={t('lists.searchPeople')}
                    value={draft.believerId}
                    disabled={disabled || people.isPending || people.isError}
                    options={(people.data ?? []).map((one) => ({
                        value: one.id,
                        label: `${one.firstName} ${one.lastName}`.trim(),
                    }))}
                    onChange={(believerId) => {
                        const one = people.data?.find((person) => person.id === believerId);
                        if (one) {
                            const label = `${one.firstName} ${one.lastName}`.trim();
                            set({ believerId, label, username: proposeListUsername(label) });
                        }
                    }}
                />
            ) : null}
            <TextField
                testID="viewer-label"
                label={t('lists.viewerLabel')}
                value={draft.label}
                maxLength={80}
                editable={!disabled}
                onChangeText={(label) =>
                    set(
                        draft.kind === 'group'
                            ? { label, username: proposeListUsername(label) }
                            : { label },
                    )
                }
            />
            <TextField
                testID="viewer-username"
                label={t('lists.username')}
                value={draft.username}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={40}
                editable={!disabled}
                onChangeText={(username) => set({ username })}
            />
            <PasswordField
                label={t('lists.password')}
                value={draft.password}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!disabled}
                onChangeText={(password) => set({ password })}
            />
            <Button
                title={t('lists.regeneratePassword')}
                variant="ghost"
                disabled={disabled}
                onPress={() => set({ password: newViewerPassword() })}
            />
            {people.isError ? (
                <TextField label={t('errors.generic')} value="" editable={false} />
            ) : null}
        </View>
    );
}
