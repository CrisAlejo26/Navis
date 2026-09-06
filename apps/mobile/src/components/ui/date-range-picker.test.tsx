import { addDays, todayIn } from '@navis/shared';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { DateRangePicker } from '@/components/ui/date-range-picker';

const today = todayIn('UTC');
const tomorrow = addDays(today, 1);

describe('DateRangePicker', () => {
  it('el primer toque marca el inicio y el segundo cierra el tramo', async () => {
    const onChange = jest.fn();
    await render(
      <DateRangePicker
        label="Fechas"
        value={null}
        placeholder="Elige un tramo"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fechas' }));
    await fireEvent.press(screen.getByLabelText(today));
    expect(onChange).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText(tomorrow));
    expect(onChange).toHaveBeenCalledWith({ from: today, to: tomorrow });
  });

  it('el atajo «Hoy» fija el tramo en un solo toque', async () => {
    const onChange = jest.fn();
    await render(
      <DateRangePicker
        label="Fechas"
        value={null}
        placeholder="Elige un tramo"
        onChange={onChange}
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Fechas' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Hoy' }));

    expect(onChange).toHaveBeenCalledWith({ from: today, to: today });
  });

  it('muestra el error cuando se pasa', async () => {
    await render(
      <DateRangePicker
        label="Fechas"
        value={null}
        placeholder="Elige un tramo"
        error="Elige un tramo de fechas"
        onChange={jest.fn()}
      />,
    );

    expect(screen.getByText('Elige un tramo de fechas')).toBeTruthy();
  });
});
