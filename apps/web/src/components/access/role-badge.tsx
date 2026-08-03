import { ROLE_HIERARCHY, type RoleRow, type RoleSlug } from '@navis/shared';

import { cn } from '@/lib/cn';
import { useRoleLabel } from '@/lib/roles';

/** Tantos puntos como escalones tiene la jerarquía de serie. */
const STEPS = Object.keys(ROLE_HIERARCHY).length;

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
 * quién manda más sin tener que recordar el orden de los nombres (Regla 9). El
 * nombre va siempre; el color nunca informa solo.
 */
export function RoleBadge({ slug, role, className }: RoleBadgeProps) {
  const label = useRoleLabel();
  const level = role?.level ?? -1;

  return (
    <span className={cn('gap-2 inline-flex items-center', className)}>
      <span aria-hidden className="flex gap-[3px]">
        {Array.from({ length: STEPS }, (_, index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              index <= level ? 'bg-primary' : 'bg-muted-foreground/25',
            )}
          />
        ))}
      </span>
      <span className="text-sm">{label(role ?? { slug })}</span>
    </span>
  );
}
