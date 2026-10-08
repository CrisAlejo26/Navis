import { addDays } from './dates';
import { toSearchName } from './schemas/believers';
import type { JournalWindow } from './schemas/journal-queries';

/** Canonical search index used by the server and the offline notebook. */
export function journalSearchText(
    title: string,
    annotation: string,
    learned: string | null,
): string {
    return toSearchName([title, annotation, learned ?? ''].join(' '));
}

/** Inclusive calendar windows: today plus six or twenty-nine previous days. */
export function journalWindowStart(window: JournalWindow, today: string): string | null {
    if (window === '7d') return addDays(today, -6);
    if (window === '30d') return addDays(today, -29);
    if (window === 'year') return `${today.slice(0, 4)}-01-01`;
    return null;
}
