import { ROLE_LEVELS, type RoleRow, type RoleSlug } from '@navis/shared';

import { accentVars, ACCENT_RAIL } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { roleAccent, useRoleLabel } from '@/lib/roles';

/**
 * Tantos puntos como escalones distintos tiene la jerarquía, no como roles hay:
 * los cuatro ministerios comparten nivel y dibujarían un punto cada uno.
 */
const STEPS = ROLE_LEVELS.length;

interface RoleBadgeProps {
  slug: RoleSlug;
  /** La fila del catálogo, si se tiene: de ahí salen el nombre y el nivel. */
  role?: RoleRow;
  className?: string;
}

/**
 * El rol, con su sitio en la jerarquía dibujado al lado.
 *
 * Los puntos no son adorno: son el nivel del rol, así que de un vistazo se ve
 * quién manda más sin tener que recordar el orden de los nombres (Regla 9). Y
 * cada nivel tiene **su** color (`roleAccent`), no el azul de siempre: es lo
 * que hace que un vistazo a la tabla de cuentas diga qué rol tiene cada una
 * antes de leer una sola palabra. El nombre va siempre; el color nunca
 * informa solo.
 */
export function RoleBadge({ slug, role, className }: RoleBadgeProps) {
  const label = useRoleLabel();
  const level = role?.level ?? -1;

  return (
    <span
      style={role ? accentVars(roleAccent(role.level)) : undefined}
      className={cn('gap-2 inline-flex items-center', className)}
    >
      <span aria-hidden className="flex gap-[3px]">
        {Array.from({ length: STEPS }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              index <= level ? (role ? ACCENT_RAIL : 'bg-primary') : 'bg-muted-foreground/25',
            )}
          />
        ))}
      </span>
      <span className="text-sm">{label(role ?? { slug })}</span>
    </span>
  );
}
