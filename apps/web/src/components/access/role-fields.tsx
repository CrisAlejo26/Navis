import { MAX_CUSTOM_ROLE_LEVEL, type RoleRow } from '@navis/shared';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Note } from '@/components/ui/note';
import { Select } from '@/components/ui/select';
import { useRoleLabel } from '@/lib/roles';

const LEVELS = Array.from({ length: MAX_CUSTOM_ROLE_LEVEL + 1 }, (_, level) => level);

/**
 * Los campos de un rol. De uno de serie solo se ofrece la descripción: su
 * nombre se traduce y su nivel es el que comparan los guards de la API, así
 * que ni siquiera se enseñan los campos.
 */
export function RoleFields({ role }: { role: RoleRow | null }) {
  const { t } = useTranslation();
  const label = useRoleLabel();

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
    </>
  );
}
