import { hexBlend } from '@/lib/color';
import type { ActivityItem } from '@/lib/tasks/filters';
import type { useTaskPalette } from './task-theme';

/** Keep tag/state accents local to icons; card surfaces use three restrained tints. */
export function activityCardSurface(item: ActivityItem, p: ReturnType<typeof useTaskPalette>) {
    const accent =
        item.status === 'completada'
            ? p.success
            : item.status === 'en_progreso'
              ? p.primary
              : item.tags[0]
                ? p.accent(item.tags[0].accent)
                : 'priority' in item
                  ? item.priority === 'alta'
                      ? p.destructive
                      : item.priority === 'baja'
                        ? p.warning
                        : p.primary
                  : p.success;
    const tone =
        item.status === 'completada' || !('priority' in item)
            ? p.success
            : item.priority === 'alta'
              ? p.warning
              : p.primary;
    const background = hexBlend(p.card, tone, p.dark ? 0.14 : 0.09);
    return {
        accent,
        background,
        border: hexBlend(background, p.foreground, p.dark ? 0.16 : 0.1),
    };
}
