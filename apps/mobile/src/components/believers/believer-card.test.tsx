import { fireEvent, render, screen } from '@testing-library/react-native';

import { BelieverCard } from '@/components/believers/believer-card';

import type { BelieverListItem } from '@navis/shared';

/** Una fila de listado como las que pinta el repositorio (§6.1). */
function creyente(overrides: Partial<BelieverListItem> = {}): BelieverListItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    churchId: '22222222-2222-2222-2222-222222222222',
    congregationId: null,
    firstName: 'María',
    lastName: 'Gómez',
    phone: null,
    email: null,
    status: 'activo',
    alertAfterDays: 30,
    lastNoteAt: null,
    createdAt: '2026-01-01',
    ministries: [],
    arrivedAt: null,
    arrivalSite: null,
    bibleReadings: null,
    vivenciasReadings: null,
    bibleInstituteTimes: null,
    ministryDates: {},
    giftDates: {},
    hasPhoto: false,
    daysWithoutNote: 4,
    needsAttention: false,
    gifts: [],
    tags: [],
    featuredTagId: null,
    notesCount: 0,
    ...overrides,
  };
}

const SIN_ACCIONES = { onAddNote: undefined, onEdit: undefined, onPress: jest.fn() };

describe('BelieverCard', () => {
  it('una tarjeta sin clasificación ocupa el mismo carril: placeholder y contador a cero', async () => {
    await render(
      <BelieverCard
        believer={creyente()}
        congregationName={null}
        ministries={[]}
        index={0}
        {...SIN_ACCIONES}
      />,
    );

    expect(screen.getByText('Sin clasificar todavía')).toBeTruthy();
    expect(screen.queryByLabelText('Dones: 0')).toBeNull();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('sin notas')).toBeTruthy();
  });

  it('una tarjeta llena pinta sus pastillas y no muestra ningún placeholder', async () => {
    await render(
      <BelieverCard
        believer={creyente({
          phone: '310 000 0000',
          notesCount: 4,
          lastNoteAt: '2026-09-10',
          gifts: [
            {
              id: '33333333-3333-3333-3333-333333333331',
              churchId: '22222222-2222-2222-2222-222222222222',
              name: 'Evangelismo',
              accent: 'success',
              position: 0,
              isSystem: true,
              isActive: true,
            },
          ],
          ministries: ['pulpito'],
          tags: [
            {
              id: '44444444-4444-4444-4444-444444444441',
              churchId: '22222222-2222-2222-2222-222222222222',
              name: 'Nueva vida',
              accent: 'warning',
              position: 0,
              isSystem: false,
              isActive: true,
            },
          ],
        })}
        congregationName="Central"
        ministries={[
          {
            id: '55555555-5555-5555-5555-555555555551',
            churchId: '22222222-2222-2222-2222-222222222222',
            slug: 'pulpito',
            name: 'Púlpito',
            accent: 'primary',
            position: 0,
            isSystem: true,
            isActive: true,
          },
        ]}
        index={0}
        {...SIN_ACCIONES}
      />,
    );

    expect(screen.queryByText('Sin clasificar todavía')).toBeNull();
    expect(screen.getByLabelText('Dones: 1')).toBeTruthy();
    expect(screen.getByLabelText('Labores: 1')).toBeTruthy();
    expect(screen.getByText('Nueva vida')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
  });

  it('deslizar a la derecha abre la nota y a la izquierda la edición', async () => {
    const onAddNote = jest.fn();
    const onEdit = jest.fn();
    const creyenteLleno = creyente();
    await render(
      <BelieverCard
        believer={creyenteLleno}
        congregationName={null}
        ministries={[]}
        index={0}
        onPress={jest.fn()}
        onAddNote={onAddNote}
        onEdit={onEdit}
      />,
    );

    await fireEvent.press(screen.getByTestId('swipe-left'));
    await fireEvent.press(screen.getByTestId('swipe-right'));

    expect(onAddNote).toHaveBeenCalledWith(creyenteLleno.id);
    expect(onEdit).toHaveBeenCalledWith(creyenteLleno);
  });

  it('en modo selección el gesto se apaga: la casilla manda', async () => {
    const onToggleSelect = jest.fn();
    await render(
      <BelieverCard
        believer={creyente()}
        congregationName={null}
        ministries={[]}
        index={0}
        selecting
        selected={false}
        onToggleSelect={onToggleSelect}
        {...SIN_ACCIONES}
      />,
    );
    await fireEvent.press(
      screen.getByRole('checkbox', {
        name: 'Seleccionar a María Gómez',
        includeHiddenElements: true,
      }),
    );
    expect(onToggleSelect).toHaveBeenCalledWith('11111111-1111-1111-1111-111111111111');
  });
});
