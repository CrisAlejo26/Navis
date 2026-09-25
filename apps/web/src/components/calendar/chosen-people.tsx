import type { MeetingSlot } from '@navis/shared';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Quién va ya en la fase, en el orden elegido, cada uno con su botón para
 * quitarlo. Sin nadie, explica cómo se elige: que se puede marcar a varios no
 * se adivina mirando una lista.
 */
export function ChosenPeople({
    people,
    onRemove,
}: {
    people: MeetingSlot['believers'];
    onRemove: (id: string) => void;
}) {
    const { t } = useTranslation();

    if (people.length === 0) {
        return <p className="text-xs text-muted-foreground">{t('calendar.pickHint')}</p>;
    }

    return (
        <ul className="gap-1.5 flex flex-wrap">
            {people.map((person) => (
                <li
                    key={person.id}
                    className="h-8 gap-1 pl-3 pr-1 text-xs font-medium flex items-center rounded-full border border-foreground/25 bg-foreground/8"
                >
                    <span className="max-w-40 truncate">{person.name}</span>
                    <button
                        type="button"
                        aria-label={t('calendar.removePerson', { name: person.name })}
                        onClick={() => {
                            onRemove(person.id);
                        }}
                        className="size-6 flex cursor-pointer items-center justify-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                        <X size={13} aria-hidden />
                    </button>
                </li>
            ))}
        </ul>
    );
}
