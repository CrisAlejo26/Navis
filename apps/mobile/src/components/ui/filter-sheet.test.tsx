import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FilterSheet } from '@/components/ui/filter-sheet';

describe('FilterSheet', () => {
  it('pinta los campos que le pasan como children', async () => {
    await render(
      <FilterSheet visible onClose={jest.fn()} title="Filtros" onApply={jest.fn()}>
        <Text>Campo de ejemplo</Text>
      </FilterSheet>,
    );

    expect(screen.getByText('Campo de ejemplo')).toBeTruthy();
  });

  it('Cancelar cierra sin aplicar', async () => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    await render(
      <FilterSheet visible onClose={onClose} title="Filtros" onApply={onApply}>
        <Text>Campo de ejemplo</Text>
      </FilterSheet>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it('Aplicar confirma y cierra', async () => {
    const onClose = jest.fn();
    const onApply = jest.fn();
    await render(
      <FilterSheet visible onClose={onClose} title="Filtros" onApply={onApply}>
        <Text>Campo de ejemplo</Text>
      </FilterSheet>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Aplicar' }));

    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
