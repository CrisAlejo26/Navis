import type { IoniconName } from '@/lib/nav-mobile';
export const tableIcons: Record<string, IoniconName> = {
    clipboard: 'clipboard-outline',
    users: 'people-outline',
    calendar: 'calendar-outline',
    archive: 'archive-outline',
    book: 'book-outline',
    star: 'star-outline',
    briefcase: 'briefcase-outline',
    mail: 'mail-outline',
};
export const tableIconLabels = {
    clipboard: 'tasks.icons.clipboard',
    users: 'tasks.icons.users',
    calendar: 'tasks.icons.calendar',
    archive: 'tasks.icons.archive',
    book: 'tasks.icons.book',
    star: 'tasks.icons.star',
} as const;
