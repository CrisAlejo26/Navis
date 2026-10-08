import { accentHex } from '@navis/theme';
import { ROLE_HINT_KEY, ROLE_LABEL_KEY, isSystemRole, roleColor } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useThemeStore } from '@/lib/theme';
import { useRoleCatalog } from './use-users';

/**
 * Nombre y color de un rol por su slug. El catálogo trae el nivel y el nombre
 * propio de los roles de la instalación; los de serie se traducen por clave.
 */
export function useRoleDisplay() {
    const { t } = useTranslation();
    const theme = useThemeStore((state) => state.resolvedTheme);
    const catalog = useRoleCatalog();
    const bySlug = useMemo(
        () => new Map((catalog.data ?? []).map((role) => [role.slug, role])),
        [catalog.data],
    );
    return {
        roles: catalog.data ?? [],
        label: (slug: string): string => {
            if (isSystemRole(slug)) return t(ROLE_LABEL_KEY[slug]);
            return bySlug.get(slug)?.name ?? slug;
        },
        /** Qué hace el rol: traducido si es de serie, y lo que escribió quien lo creó si es propio. */
        hint: (slug: string): string | null =>
            isSystemRole(slug) ? t(ROLE_HINT_KEY[slug]) : (bySlug.get(slug)?.description ?? null),
        color: (slug: string): string =>
            accentHex(roleColor({ slug, level: bySlug.get(slug)?.level ?? 0 }), theme),
    };
}
