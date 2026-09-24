import { render, screen } from '@testing-library/react-native';

import { CardGroup } from '@/components/ui/card-group';
import { ListRow } from '@/components/ui/list-row';

describe('CardGroup', () => {
    it('muestra sus filas', async () => {
        await render(
            <CardGroup>
                <ListRow title="Primera" />
                <ListRow title="Segunda" />
            </CardGroup>,
        );

        expect(screen.getByText('Primera')).toBeTruthy();
        expect(screen.getByText('Segunda')).toBeTruthy();
    });
});
