import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';

import { Emotion } from './emotion.entity';

/**
 * El vocabulario de emociones: las doce de serie y las de cada cual.
 *
 * «Suyas» aquí significa **las del sistema más las propias**, que es lo que ve
 * quien abre el selector. Por eso la consulta es siempre por `owner_id IS NULL
 * OR owner_id = :ownerId` y no hay forma de pedir solo las de otro.
 */
@Injectable()
export class EmotionsRepository {
  constructor(@InjectRepository(Emotion) private readonly emotions: Repository<Emotion>) {}

  /** Las que puede usar: las de serie primero, después las suyas. */
  findAvailable(ownerId: string): Promise<Emotion[]> {
    return this.emotions.find({
      where: [{ ownerId: IsNull() }, { ownerId }],
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  /** Las de esos identificadores que de verdad puede usar. Filtra lo ajeno. */
  async findUsable(ownerId: string, ids: readonly string[]): Promise<Emotion[]> {
    if (ids.length === 0) return [];

    return this.emotions.find({
      where: [
        { id: In([...ids]), ownerId: IsNull() },
        { id: In([...ids]), ownerId },
      ],
    });
  }

  /**
   * La emoción propia, para editarla o borrarla.
   *
   * Las de serie se distinguen por no tener dueño, y se responde **403 y no
   * 404**: existen y se ven, lo que no se puede es tocarlas (D6). Aquí sí tiene
   * sentido distinguir, al revés que con un sueño ajeno.
   */
  async requireOwn(ownerId: string, id: string): Promise<Emotion> {
    const emotion = await this.emotions.findOne({ where: { id } });
    if (!emotion) throw new NotFoundException('Esa emoción no existe');
    if (emotion.ownerId === null) {
      throw new ForbiddenException('Las emociones de serie no se pueden cambiar');
    }
    if (emotion.ownerId !== ownerId) throw new NotFoundException('Esa emoción no existe');

    return emotion;
  }

  create(ownerId: string, data: Pick<Emotion, 'name' | 'accent'>): Emotion {
    // `position` alto para que las propias caigan detrás de las doce de serie.
    return this.emotions.create({ ...data, ownerId, slug: null, position: 100 });
  }

  save(emotion: Emotion): Promise<Emotion> {
    return this.emotions.save(emotion);
  }

  async softRemove(emotion: Emotion): Promise<void> {
    await this.emotions.softRemove(emotion);
  }
}
