import { fireEvent, render, screen } from '@testing-library/react-native';

import { SegmentedControl } from '@/components/ui/segmented-control';

const OPTIONS = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
];

describe('SegmentedControl', () => {
  it('marca como seleccionada la opción activa', async () => {
    await render(<SegmentedControl options={OPTIONS} value="week" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Semana', selected: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Día', selected: false })).toBeTruthy();
  });

  it('llama a onChange con el valor de la opción pulsada', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={OPTIONS} value="day" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Semana' }));

    expect(onChange).toHaveBeenCalledWith('week');
  });
});
