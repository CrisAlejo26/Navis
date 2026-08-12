import type { TagRef } from '@navis/shared';

import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { TASK_ICON_MAP } from '@/lib/tasks/icon-map';

/**
 * Una etiqueta pintada: su icono y su color, nunca solo el color (Regla 3
 * §7). Es el elemento que hace que una tarjeta se distinga de otra de un
 * vistazo (§9.1, D12).
 */
export function TagChip({ tag, size = 'md' }: { tag: TagRef; size?: 'sm' | 'md' }) {
  const Icon = TASK_ICON_MAP[tag.icon];

  return (
    <span
      style={accentVars(tag.accent)}
      className={cn(
        'gap-1 font-medium inline-flex items-center rounded-full border',
        'border-[color-mix(in_oklab,var(--acento)_35%,transparent)] bg-[color-mix(in_oklab,var(--acento)_14%,transparent)] text-[var(--acento)]',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 11 : 12} aria-hidden />}
      {tag.name}
    </span>
  );
}
