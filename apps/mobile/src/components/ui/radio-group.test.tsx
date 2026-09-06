import { fireEvent, render, screen } from '@testing-library/react-native';

import { RadioGroup } from '@/components/ui/radio-group';

const OPTIONS = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English', description: 'International' },
];

describe('RadioGroup', () => {
  it('marca como seleccionada la opción activa', async () => {
    await render(<RadioGroup options={OPTIONS} value="en" onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'English', selected: true })).toBeTruthy();
    expect(screen.getByRole('radio', { name: 'Español', selected: false })).toBeTruthy();
  });

  it('llama a onChange con el valor de la opción pulsada', async () => {
    const onChange = jest.fn();
    await render(<RadioGroup options={OPTIONS} value="es" onChange={onChange} />);

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    expect(onChange).toHaveBeenCalledWith('en');
  });
});
