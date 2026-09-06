import { fireEvent, render, screen } from '@testing-library/react-native';

import { AnimatedTabBar } from '@/components/navigation/animated-tab-bar';
import { TAB_BAR_ENTRIES } from '@/lib/nav-mobile';

type TabBarProps = Parameters<typeof AnimatedTabBar>[0];

function makeProps(overrides: Partial<Record<keyof TabBarProps, unknown>> = {}): TabBarProps {
  return {
    state: {
      index: 0,
      routes: TAB_BAR_ENTRIES.map((entry) => ({ key: entry.name, name: entry.name })),
    } as TabBarProps['state'],
    navigation: { navigate: jest.fn(), emit: jest.fn() } as unknown as TabBarProps['navigation'],
    descriptors: {},
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    menuOpen: false,
    onToggleMenu: jest.fn(),
    ...overrides,
  } as TabBarProps;
}

/** La barra inferior pinta las cinco pestañas y reparte los pulsos. */
describe('AnimatedTabBar', () => {
  it('pinta las cinco pestañas', async () => {
    await render(<AnimatedTabBar {...makeProps()} />);
    for (const label of ['Inicio', 'Calendario', 'Creyentes', 'Más', 'Ajustes']) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it('navega a la pestaña pulsada', async () => {
    const navigate = jest.fn();
    await render(<AnimatedTabBar {...makeProps({ navigation: { navigate, emit: jest.fn() } })} />);
    await fireEvent.press(screen.getByLabelText('Calendario'));
    expect(navigate).toHaveBeenCalledWith('calendar');
  });

  it('«Más» abre el menú en vez de navegar', async () => {
    const navigate = jest.fn();
    const onToggleMenu = jest.fn();
    await render(
      <AnimatedTabBar
        {...makeProps({ navigation: { navigate, emit: jest.fn() }, onToggleMenu })}
      />,
    );
    await fireEvent.press(screen.getByLabelText('Más'));
    expect(onToggleMenu).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
