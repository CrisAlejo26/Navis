import { fireEvent, render, screen } from '@testing-library/react-native';

import { Checkbox } from '@/components/ui/checkbox';

describe('Checkbox', () => {
  it('llama a onChange con el valor contrario al pulsar', async () => {
    const onChange = jest.fn();
    await render(<Checkbox label="Recordarme" checked={false} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Recordarme' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('expone su estado marcado', async () => {
    await render(<Checkbox label="Recordarme" checked onChange={jest.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Recordarme', checked: true })).toBeTruthy();
  });
});
