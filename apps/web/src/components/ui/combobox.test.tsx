import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { renderWithI18n } from '@/test/render';

const OPTIONS: ComboboxOption[] = [
  { value: 'ES', label: 'España' },
  { value: 'CO', label: 'Colombia' },
  { value: 'FR', label: 'Francia' },
];

function pintar(overrides: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onSelect = vi.fn();
  const onQueryChange = vi.fn();

  renderWithI18n(
    <Combobox
      label="País"
      value=""
      options={OPTIONS}
      query=""
      onQueryChange={onQueryChange}
      onSelect={onSelect}
      emptyLabel="Ningún país coincide"
      {...overrides}
    />,
  );

  return { onSelect, onQueryChange };
}

describe('el combobox de «escribe y filtra»', () => {
  it('abre la lista al enfocar el campo y enseña las opciones', () => {
    pintar();

    fireEvent.focus(screen.getByRole('combobox'));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('elige una opción al hacer click y cierra la lista', () => {
    const { onSelect } = pintar();

    fireEvent.focus(screen.getByRole('combobox'));
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Colombia' }));

    expect(onSelect).toHaveBeenCalledWith('CO');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('recorre las opciones con el teclado y elige con Enter', () => {
    const { onSelect } = pintar();
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledWith('CO');
  });

  it('Escape cierra la lista sin elegir nada', () => {
    const { onSelect } = pintar();
    const input = screen.getByRole('combobox');

    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('con la lista vacía enseña el mensaje en vez de opciones', () => {
    pintar({ options: [] });

    fireEvent.focus(screen.getByRole('combobox'));

    expect(screen.getByText('Ningún país coincide')).toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('cerrado, enseña la etiqueta de lo elegido y no el código', () => {
    pintar({ value: 'ES' });

    expect(screen.getByRole('combobox')).toHaveValue('España');
  });

  it('escribir avisa a quien lo usa con lo tecleado', () => {
    const { onQueryChange } = pintar();

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'col' } });

    expect(onQueryChange).toHaveBeenCalledWith('col');
  });
});
