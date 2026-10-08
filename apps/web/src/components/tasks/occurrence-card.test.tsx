import { screen } from '@testing-library/react';
import { addDays, todayIn } from '@navis/shared';
import { beforeAll, describe, expect, it } from 'vitest';

import { OccurrenceCard } from '@/components/tasks/occurrence-card';
import { i18n } from '@/lib/i18n';
import { renderWithI18n } from '@/test/render';

const today = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);

function pintar(dueDate: string | null, completed = false) {
    renderWithI18n(
        <ul>
            <OccurrenceCard
                title="Preparar el sermón"
                time={null}
                tags={[]}
                completed={completed}
                dueDate={dueDate}
                onToggle={() => undefined}
                onOpen={() => undefined}
            />
        </ul>,
    );
}

describe('OccurrenceCard: el límite de una tarea', () => {
    beforeAll(async () => {
        await i18n.changeLanguage('es');
    });

    it('dice cuándo vence si todavía hay tiempo', () => {
        pintar(addDays(today, 3));
        expect(screen.getByText(/^Vence /)).toBeTruthy();
        expect(screen.queryByText(/Vencida/)).toBeNull();
    });

    it('el mismo día del límite todavía no está vencida', () => {
        pintar(today);
        expect(screen.getByText(/^Vence /)).toBeTruthy();
    });

    it('con el límite pasado se marca como vencida, con la palabra y no solo el color', () => {
        pintar(addDays(today, -2));
        expect(screen.getByText(/^Vencida · /)).toBeTruthy();
    });

    // Regresión de diseño: una tarea hecha no se queda en rojo por haber llegado tarde.
    it('una tarea completada no se enseña como vencida', () => {
        pintar(addDays(today, -2), true);
        expect(screen.queryByText(/Vencida/)).toBeNull();
        expect(screen.getByText(/^Vence /)).toBeTruthy();
    });

    it('sin límite no pinta nada de límite', () => {
        pintar(null);
        expect(screen.queryByText(/Vence|Vencida/)).toBeNull();
    });
});
