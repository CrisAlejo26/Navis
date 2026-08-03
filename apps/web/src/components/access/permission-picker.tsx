import { PERMISSION_MODULES, permissionsOfModule, type Permission } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Checkbox } from '@/components/ui/checkbox';
import { MODULE_LABEL_KEY } from '@/lib/permission-labels';

/** La acción que hay detrás de cada permiso, para poner la columna en su sitio. */
const ACTION_LABEL_KEY = { view: 'permissions.view', manage: 'permissions.manage' } as const;

const actionOf = (permission: Permission): 'view' | 'manage' =>
  permission.endsWith('.manage') ? 'manage' : 'view';

/**
 * Qué puede hacer un rol, módulo a módulo.
 *
 * Se pinta como una tabla y no como una lista de diecisiete casillas sueltas:
 * la pregunta que se hace quien reparte accesos es «¿qué ve recepción?», y esa
 * se responde leyendo una fila.
 *
 * Las casillas van con el mismo `name`, así que el formulario las recoge con
 * `getAll('permissions')` sin estado propio de React.
 */
export function PermissionPicker({ granted }: { granted: readonly string[] }) {
  const { t } = useTranslation();

  return (
    <fieldset className="gap-3 flex flex-col">
      <legend className="mb-2 text-sm font-medium">{t('permissions.title')}</legend>

      {PERMISSION_MODULES.map((module) => (
        <div
          key={module}
          className="gap-3 pb-3 flex flex-wrap items-center justify-between border-b last:border-b-0"
        >
          <span className="text-sm">{t(MODULE_LABEL_KEY[module])}</span>

          <div className="gap-4 flex">
            {permissionsOfModule(module).map((permission) => (
              <Checkbox
                key={permission}
                name="permissions"
                value={permission}
                defaultChecked={granted.includes(permission)}
                label={t(ACTION_LABEL_KEY[actionOf(permission)])}
              />
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
