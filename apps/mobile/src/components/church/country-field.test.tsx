import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CountryField } from './country-field';

function Form() {
    const [country, setCountry] = useState('CO');
    return <CountryField value={country} onChange={setCountry} />;
}
// Buscar por ISO y elegir un país actualiza el valor; el teclado no necesita cerrarse primero.
it('filtra países y cambia el seleccionado', async () => {
    await render(<Form />);
    await fireEvent.press(screen.getByRole('button', { name: 'País' }));
    await fireEvent.changeText(screen.getByLabelText('Escribe para buscar'), 'DE');
    expect(screen.queryByRole('button', { name: 'Colombia' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Alemania' }));
    expect(screen.getByText('Alemania')).toBeTruthy();
});
