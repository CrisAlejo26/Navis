import { render, screen } from '@testing-library/react-native';

import { PageDots } from '@/components/ui/page-dots';

describe('PageDots', () => {
    it('expone la posición actual como barra de progreso', async () => {
        await render(<PageDots count={3} activeIndex={1} />);

        const dots = screen.getByRole('progressbar');
        expect(dots.props.accessibilityValue).toEqual({ min: 0, max: 2, now: 1 });
    });
});
