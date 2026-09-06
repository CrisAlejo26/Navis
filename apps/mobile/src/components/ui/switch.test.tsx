import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from '@/components/ui/switch';

describe('Switch', () => {
  it('llama a onChange con el valor contrario al pulsar cualquier parte de la fila', async () => {
    const onChange = jest.fn();
    await render(<Switch label="Notificaciones" checked={false} onChange={onChange} />);

    await fireEvent.press(screen.getByRole('switch', { name: 'Notificaciones' }));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('expone su estado activado', async () => {
    await render(<Switch label="Notificaciones" checked onChange={jest.fn()} />);

    expect(screen.getByRole('switch', { name: 'Notificaciones', checked: true })).toBeTruthy();
  });
});
