import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoleRow } from '@navis/shared';

import { Chip } from '@/components/ui/chip';

/** «Todos» y un chip por rol que tenga cuentas, cada uno de su color; marcar uno filtra la lista. */
export function RoleFilterChips({
    roles,
    selected,
    label,
    color,
    onSelect,
}: {
    roles: RoleRow[];
    selected: string | null;
    label: (slug: string) => string;
    color: (slug: string) => string;
    onSelect: (slug: string | null) => void;
}) {
    const { t } = useTranslation();
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            accessibilityLabel={t('roles.filterByRole')}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        >
            <Chip
                label={t('roles.allRoles')}
                selected={selected === null}
                onPress={() => onSelect(null)}
            />
            {roles
                .filter((role) => role.usersCount > 0)
                .map((role) => (
                    <Chip
                        key={role.slug}
                        label={`${label(role.slug)} · ${String(role.usersCount)}`}
                        color={color(role.slug)}
                        selected={selected === role.slug}
                        onPress={() => onSelect(selected === role.slug ? null : role.slug)}
                    />
                ))}
        </ScrollView>
    );
}
