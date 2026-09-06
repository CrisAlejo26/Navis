import { render, screen } from '@testing-library/react-native';

import { BodyText, Caption } from '@/components/ui/text';
import { Subtitle } from '@/components/ui/subtitle';
import { Title } from '@/components/ui/title';

/** En @testing-library/react-native 14, `render` es asíncrono (React 19). */
describe('componentes de tipografía', () => {
  it('Title expone accessibilityRole="header" para lectores de pantalla', async () => {
    await render(<Title>Bitácora</Title>);
    expect(screen.getByRole('header')).toHaveTextContent('Bitácora');
  });

  it('Subtitle, BodyText y Caption renderizan el texto recibido', async () => {
    await render(
      <>
        <Subtitle>Acompaña al título</Subtitle>
        <BodyText>Cuerpo del texto</BodyText>
        <Caption>Nota al pie</Caption>
      </>,
    );
    expect(screen.getByText('Acompaña al título')).toBeTruthy();
    expect(screen.getByText('Cuerpo del texto')).toBeTruthy();
    expect(screen.getByText('Nota al pie')).toBeTruthy();
  });
});
