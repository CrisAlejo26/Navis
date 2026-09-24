import { render, screen } from '@testing-library/react-native';

import { Sonda } from '@/components/believers/sonda';

/** La sonda es el elemento firma de la pantalla: hay que hacerla bien (§7.3). */
describe('Sonda', () => {
    it('dice hace cuánto fue la última nota', async () => {
        await render(<Sonda daysWithoutNote={7} alertAfterDays={30} hasNotes />);
        expect(screen.getByText('hace 7 d')).toBeTruthy();
    });

    it('sin ninguna nota no se disfraza de cero: «sin notas»', async () => {
        await render(<Sonda daysWithoutNote={5} alertAfterDays={30} hasNotes={false} />);
        expect(screen.getByText('sin notas')).toBeTruthy();
    });

    it('el desbordado se anuncia con su icono y su texto en rojo', async () => {
        await render(<Sonda daysWithoutNote={34} alertAfterDays={20} hasNotes />);
        expect(screen.getByText('hace 34 d')).toBeTruthy();
        expect(screen.getByLabelText('Última nota hace 34 días; avisa a los 20.')).toBeTruthy();
    });

    it('el aviso apagado se nota por ausencia: solo texto, sin pista', async () => {
        await render(<Sonda daysWithoutNote={12} alertAfterDays={null} hasNotes />);
        expect(screen.getByText('hace 12 d')).toBeTruthy();
        expect(
            screen.getByLabelText('Última nota hace 12 días; el aviso está apagado.'),
        ).toBeTruthy();
    });

    it('sin notas y con margen, la voz lee la versión del alta', async () => {
        await render(<Sonda daysWithoutNote={3} alertAfterDays={30} hasNotes={false} />);
        expect(
            screen.getByLabelText('Todavía sin ninguna nota; avisa a los 30 días desde el alta.'),
        ).toBeTruthy();
    });
});
