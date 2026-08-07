import type { RoleSlug } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Select } from '@/components/ui/select';
import { ROLE_HINT_KEY, useRoleCatalog, useRoleLabel } from '@/lib/roles';
import { isSystemRole } from '@navis/shared';

interface RoleSelectProps {
  name?: string;
  label?: string;
  value?: RoleSlug;
  defaultValue?: RoleSlug;
  onChange?: (slug: RoleSlug | undefined) => void;
  /** Texto de la opción «todos», cuando el desplegable se usa como filtro. */
  allLabel?: string;
  /**
   * Si se pasa, solo se listan los roles con `level` estrictamente por debajo
   * de este. Es cortesía de interfaz (RFC 0014 D2): la barrera real la pone el
   * servidor, esto solo evita ofrecer una opción que va a acabar en un 403.
   */
  belowLevel?: number;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Desplegable de roles servido por el catálogo, no por la lista fija: así
 * aparecen también los roles propios que haya creado la instalación.
 *
 * Lo usan el filtro del listado y los formularios de alta y edición de cuentas,
 * que es lo mismo tres veces si se escribe suelto.
 */
export function RoleSelect({
  name,
  label,
  value,
  defaultValue,
  onChange,
  allLabel,
  belowLevel,
  size = 'md',
  className,
}: RoleSelectProps) {
  const { t } = useTranslation();
  const catalog = useRoleCatalog();
  const roleLabel = useRoleLabel();
  const roles = [...catalog.values()]
    .filter((role) => belowLevel === undefined || role.level < belowLevel)
    .sort((a, b) => a.level - b.level);

  return (
    <Select
      name={name}
      label={label}
      size={size}
      className={className}
      value={value}
      defaultValue={defaultValue}
      aria-label={label ?? t('roles.role')}
      onChange={(event) => {
        onChange?.(event.target.value === '' ? undefined : event.target.value);
      }}
    >
      {allLabel && <option value="">{allLabel}</option>}
      {roles.map((role) => {
        const hint = isSystemRole(role.slug) ? t(ROLE_HINT_KEY[role.slug]) : role.description;
        return (
          <option key={role.slug} value={role.slug}>
            {roleLabel(role)}
            {hint ? ` — ${hint}` : ''}
          </option>
        );
      })}
    </Select>
  );
}
