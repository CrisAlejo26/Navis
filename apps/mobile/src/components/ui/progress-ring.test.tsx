import { render, screen } from '@testing-library/react-native';

import { ProgressRing } from '@/components/ui/progress-ring';

describe('ProgressRing', () => {
    it('muestra la etiqueta del centro', async () => {
        await render(<ProgressRing progress={0.6} label="60%" />);

        expect(screen.getByText('60%')).toBeTruthy();
    });

    it('recorta el progreso a 0–1 sin romper', async () => {
        await expect(render(<ProgressRing progress={1.5} label="150%" />)).resolves.toBeTruthy();
        await expect(render(<ProgressRing progress={-1} />)).resolves.toBeTruthy();
    });
});
