import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import { toSearchText } from './dream-fields';
import type { DreamEmotionsRepository } from './dream-emotions.repository';
import type { Dream } from './dream.entity';
import { DreamsService } from './dreams.service';
import type { DreamsRepository } from './dreams.repository';
import type { Emotion } from './emotion.entity';
import type { EmotionsRepository } from './emotions.repository';

const sueño = (overrides: Partial<Dream> = {}): Dream =>
  ({
    id: 'd1',
    ownerId: 'u1',
    title: 'La puerta',
    body: 'Había una puerta abierta',
    searchText: 'la puerta habia una puerta abierta',
    dreamedAt: '2026-03-14',
    interpretation: null,
    fulfilledAt: null,
    fulfillmentMeaning: null,
    audios: [],
    createdAt: new Date('2026-03-14T08:00:00.000Z'),
    ...overrides,
  }) as Dream;

const emocion = (id: string, ownerId: string | null = null): Emotion =>
  ({
    id,
    ownerId,
    slug: ownerId ? null : 'paz',
    name: null,
    accent: '#16a34a',
    position: 3,
  }) as Emotion;

/**
 * Dobles de los repositorios: solo implementan lo que el servicio usa, y por
 * eso llevan la conversión comentada (Regla 10 §2).
 *
 * `require` reproduce la regla de D1 —solo devuelve lo del dueño que se pide—
 * porque es justo lo que varios de estos tests comprueban.
 */
function build(existing: Dream | null, vocabulary: Emotion[] = []) {
  const softRemove = vi.fn(() => Promise.resolve());
  const setFor = vi.fn(() => Promise.resolve());
  const saved: Dream[] = [];
  // La fila «en la base»: al crear no hay ninguna hasta que se guarda, y el
  // servicio vuelve a leerla para devolver la ficha montada.
  let current = existing;

  const require = (ownerId: string, id: string) => {
    if (!current || current.ownerId !== ownerId || current.id !== id) {
      return Promise.reject(new NotFoundException('Ese sueño no existe'));
    }
    return Promise.resolve(current);
  };

  const dreams = {
    require,
    requireFull: require,
    create: (ownerId: string, data: Partial<Dream>) =>
      ({ ...data, ownerId, id: 'd1', createdAt: new Date('2026-03-14T08:00:00.000Z') }) as Dream,
    save: (dream: Dream) => {
      saved.push(dream);
      current = dream;
      return Promise.resolve(dream);
    },
    softRemove,
  } as unknown as DreamsRepository;

  const links = {
    setFor,
    forDreams: () => Promise.resolve(new Map<string, Emotion[]>()),
  } as unknown as DreamEmotionsRepository;

  const emotions = {
    findUsable: (ownerId: string, ids: readonly string[]) =>
      Promise.resolve(
        vocabulary.filter(
          (one) => ids.includes(one.id) && (one.ownerId === null || one.ownerId === ownerId),
        ),
      ),
  } as unknown as EmotionsRepository;

  return { service: new DreamsService(dreams, links, emotions), saved, softRemove, setFor };
}

describe('apuntar un sueño', () => {
  it('guarda el texto de búsqueda normalizado, para que «vision» encuentre «visión»', async () => {
    const { service, saved } = build(null);

    await service.create('u1', { body: 'Una visión del río', dreamedAt: '2026-03-14' });

    expect(saved[0]?.searchText).toBe('una vision del rio');
  });

  it('acepta un sueño sin título: a las cuatro de la mañana nadie titula (D17)', async () => {
    const { service, saved } = build(null);

    await service.create('u1', { body: 'Solo el cuerpo', dreamedAt: '2026-03-14' });

    expect(saved[0]?.title).toBeNull();
  });

  it('nace sin interpretación y sin cumplir, aunque llegue con emociones', async () => {
    const { service, saved } = build(null, [emocion('e1')]);

    await service.create('u1', {
      body: 'Texto',
      dreamedAt: '2026-03-14',
      emotionIds: ['e1'],
    });

    expect(saved[0]?.interpretation).toBeNull();
    expect(saved[0]?.fulfilledAt).toBeNull();
  });
});

describe('las emociones que se pegan al sueño', () => {
  it('descarta las que no puede usar en vez de tumbar la petición entera', async () => {
    const { service, setFor } = build(sueño(), [emocion('mia', 'u1'), emocion('ajena', 'otro')]);

    await service.update('u1', 'd1', { emotionIds: ['mia', 'ajena'] });

    expect(setFor).toHaveBeenCalledWith('d1', ['mia']);
  });

  it('no toca las que ya tenía si el cambio no las menciona', async () => {
    const { service, setFor } = build(sueño());

    await service.update('u1', 'd1', { title: 'Otro título' });

    expect(setFor).not.toHaveBeenCalled();
  });
});

describe('interpretar y cumplir', () => {
  it('una interpretación en blanco se guarda como «no hay» (D8)', async () => {
    const { service, saved } = build(sueño());

    await service.update('u1', 'd1', { interpretation: '   ' });

    expect(saved[0]?.interpretation).toBeNull();
  });

  it('cerrarlo es poner la fecha y lo que significó', async () => {
    const { service, saved } = build(sueño());

    await service.update('u1', 'd1', {
      fulfilledAt: '2026-06-20',
      fulfillmentMeaning: 'Se abrió la puerta de verdad',
    });

    expect(saved[0]?.fulfilledAt).toBe('2026-06-20');
    expect(saved[0]?.fulfillmentMeaning).toBe('Se abrió la puerta de verdad');
  });

  /* Regresión de D10: sin esto quedaba la frase de un cumplimiento que ya no
     existe, y la ficha la seguía enseñando. */
  it('reabrirlo se lleva por delante lo que significó', async () => {
    const cumplido = sueño({ fulfilledAt: '2026-06-20', fulfillmentMeaning: 'Pasó' });
    const { service, saved } = build(cumplido);

    await service.update('u1', 'd1', { fulfilledAt: null });

    expect(saved[0]?.fulfilledAt).toBeNull();
    expect(saved[0]?.fulfillmentMeaning).toBeNull();
  });

  it('no acepta lo que significó en un sueño que no está cumplido', async () => {
    const { service, saved } = build(sueño());

    await service.update('u1', 'd1', { fulfillmentMeaning: 'Algo' });

    expect(saved[0]?.fulfillmentMeaning).toBeNull();
  });

  it('no deja cerrarlo con una fecha anterior a la noche (D12)', async () => {
    const { service } = build(sueño());

    await expect(service.update('u1', 'd1', { fulfilledAt: '2026-01-01' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rehace el texto de búsqueda al escribir la interpretación', async () => {
    const { service, saved } = build(sueño());

    await service.update('u1', 'd1', { interpretation: 'Creo que habla de esperar' });

    expect(saved[0]?.searchText).toBe(
      toSearchText('La puerta', 'Había una puerta abierta', 'Creo que habla de esperar'),
    );
  });
});

describe('la barrera del dueño (D1)', () => {
  it('el sueño de otro no existe para quien pregunta', async () => {
    const { service } = build(sueño({ ownerId: 'otro' }));

    await expect(service.get('u1', 'd1')).rejects.toThrow(NotFoundException);
    await expect(service.update('u1', 'd1', { title: 'Mío' })).rejects.toThrow(NotFoundException);
  });

  it('y tampoco se puede borrar', async () => {
    const { service, softRemove } = build(sueño({ ownerId: 'otro' }));

    await expect(service.remove('u1', 'd1')).rejects.toThrow(NotFoundException);
    expect(softRemove).not.toHaveBeenCalled();
  });
});
