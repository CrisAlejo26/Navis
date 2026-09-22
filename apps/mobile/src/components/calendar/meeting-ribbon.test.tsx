import { MeetingRibbon } from '@/components/calendar/meeting-ribbon';
import { render, screen } from '@testing-library/react-native';

/**
 * La cinta de fases (RFC 0002 §8.1): pinta las fases en su orden y los huecos
 * no se esconden — una fase sin asignar es una línea de puntos. La cabecera
 * lleva el nombre y la hora; una cancelada no se puede asignar.
 */

const CULTO = {
  id: 'm1',
  congregationId: 'c1',
  patternId: null,
  name: 'Culto',
  startTime: '20:00',
  accent: 'primary',
  status: 'programada' as const,
  notes: null,
  slots: [
    {
      id: 's1',
      name: 'Introducción',
      position: 0,
      note: null,
      believer: { id: 'b1', name: 'Juan Carlos' },
    },
    { id: null, name: 'Enseñanza', position: 1, note: null, believer: null },
  ],
};

describe('la cinta de fases', () => {
  it('pinta las fases en su orden, con el nombre de quien ocupa cada una', async () => {
    await render(<MeetingRibbon meeting={CULTO} />);
    expect(screen.getByText('Introducción')).toBeOnTheScreen();
    expect(screen.getByText('Juan Carlos')).toBeOnTheScreen();
    expect(screen.getByText('Enseñanza')).toBeOnTheScreen();
    // El hueco se ve: es la información que hoy se pierde en el Excel.
    expect(screen.getByText('···········')).toBeOnTheScreen();
  });

  it('con varias sedes la cabecera lleva el nombre de la sede (D12)', async () => {
    await render(<MeetingRibbon meeting={CULTO} congregationName="Elda" />);
    expect(screen.getByText(/Elda/)).toBeOnTheScreen();
  });

  it('una reunión cancelada se anuncia y no lleva asignación interactiva', async () => {
    const onPick = jest.fn();
    await render(<MeetingRibbon meeting={{ ...CULTO, status: 'cancelada' }} onPick={onPick} />);
    expect(screen.getByLabelText('Culto, 20:00')).toBeOnTheScreen();
    expect(onPick).not.toHaveBeenCalled();
  });
});
