import { todayIn } from '@navis/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DatePicker } from '@/components/ui/date-picker';

const today = todayIn('UTC');

describe('DatePicker', () => {
  it('selecciona un día de la cuadrícula del mes visible', async () => {
    const onChange = jest.fn();
    await render(
      <DatePicker label="Fecha" value={null} placeholder="Elige un día" onChange={onChange} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fecha' }));
    await fireEvent.press(screen.getByLabelText(today));

    expect(onChange).toHaveBeenCalledWith(today);
  });

  it('el atajo «Hoy» selecciona el día actual', async () => {
    const onChange = jest.fn();
    await render(
      <DatePicker label="Fecha" value={null} placeholder="Elige un día" onChange={onChange} />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fecha' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Hoy' }));

    expect(onChange).toHaveBeenCalledWith(today);
  });

  it('muestra el error cuando se pasa', async () => {
    await render(
      <DatePicker
        label="Fecha"
        value={null}
        placeholder="Elige un día"
        error="Elige una fecha"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Elige una fecha')).toBeTruthy();
  });
});
