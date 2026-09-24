import { CalendarMonth } from '@/components/calendar/calendar-month';
import { fireEvent, render, screen } from '@testing-library/react-native';

/**
 * La rejilla del mes (RFC 0002 §8.3): hoy en azul de marca, una barra por
 * reunión con el color de su sede y el punto de festivo — el color nunca
 * informa solo: el nombre del festivo viaja en la etiqueta accesible.
 */

const REUNION = {
    id: 'm1',
    congregationId: 'c1',
    patternId: null,
    name: 'Culto',
    startTime: '20:00',
    accent: 'primary',
    status: 'programada' as const,
    notes: null,
    slots: [],
};

describe('la rejilla del mes', () => {
    it('abre el día al tocarlo, con sus reuniones en la etiqueta', async () => {
        const onOpenDay = jest.fn();
        await render(
            <CalendarMonth
                month="2026-09-15"
                today="2026-09-20"
                meetingsOf={(date) => (date === '2026-09-15' ? [REUNION] : [])}
                holidayOf={() => null}
                onOpenDay={onOpenDay}
            />,
        );

        await fireEvent.press(screen.getByLabelText('2026-09-15: 1 reuniones'));
        expect(onOpenDay).toHaveBeenCalledWith('2026-09-15');
    });

    it('el festivo va en la etiqueta accesible: el punto rojo no informa solo (§8.1)', async () => {
        await render(
            <CalendarMonth
                month="2026-09-15"
                today="2026-09-20"
                meetingsOf={() => []}
                holidayOf={(date) => (date === '2026-09-20' ? 'Día de la Independencia' : null)}
                onOpenDay={jest.fn()}
            />,
        );

        expect(
            screen.getByLabelText('2026-09-20: 0 reuniones, festivo: Día de la Independencia'),
        ).toBeOnTheScreen();
    });
});
