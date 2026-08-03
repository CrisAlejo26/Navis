import { MAX_CUSTOM_ROLE_LEVEL, SUPERADMIN_ROLE, type RoleRow } from '@navis/shared';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PermissionPicker } from '@/components/access/permission-picker';
import { Input } from '@/components/ui/input';
import { Note } from '@/components/ui/note';
import { Select } from '@/components/ui/select';
import { useRoleLabel } from '@/lib/roles';

const LEVELS = Array.from({ length: MAX_CUSTOM_ROLE_LEVEL + 1 }, (_, level) => level);

/**
 * Los campos de un rol. De uno de serie no se ofrecen ni el nombre —que se
 * traduce— ni el nivel; los permisos sí, que es para lo que está la pantalla.
 *
 * Los del superadministrador no se tocan: quitarle el comodín dejaría la
 * instalación sin nadie que pudiera devolvérselo (la API también lo impide).
 */
export function RoleFields({ role }: { role: RoleRow | null }) {
  const { t } = useTranslation();
  const label = useRoleLabel();
  const locked = role?.slug === SUPERADMIN_ROLE;

  return (
    <>
      {role?.isSystem ? (
        <Note icon={Lock} title={label(role)}>
          {t('roles.systemRoleLocked')}
        </Note>
      ) : (
        <>
          <Input
            name="name"
            label={t('roles.roleName')}
            defaultValue={role?.name ?? ''}
            autoComplete="off"
          />
          <div>
            <Select
              name="level"
              label={t('roles.roleLevel')}
              defaultValue={String(role?.level ?? 0)}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </Select>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {t('roles.roleLevelHint')}
            </p>
          </div>
        </>
      )}

      <Input
        name="description"
        label={t('roles.roleDescription')}
        defaultValue={role?.description ?? ''}
        autoComplete="off"
      />

      {locked ? (
        <Note icon={Lock} title={t('permissions.title')}>
          {t('permissions.superadminLocked')}
        </Note>
      ) : (
        <PermissionPicker granted={role?.permissions ?? []} />
      )}
    </>
  );
}
