/** Compact day/month labels keep six weekly points readable with enlarged text. */
export function statisticsDayLabel(date: string): string {
    return `${Number(date.slice(8, 10))}/${Number(date.slice(5, 7))}`;
}
