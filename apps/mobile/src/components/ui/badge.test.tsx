import { render, screen } from '@testing-library/react-native';

import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
    it('muestra su etiqueta', async () => {
        await render(<Badge label="Importado" />);

        expect(screen.getByText('Importado')).toBeTruthy();
    });

    it('expone la etiqueta como texto accesible, y el icono no la tapa', async () => {
        await render(<Badge label="Importado" icon="checkmark" />);

        expect(screen.getByText('Importado')).toBeTruthy();
    });
});
