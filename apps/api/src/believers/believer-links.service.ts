import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { BelieverGift } from './believer-gift.entity';
import { BelieverMinistry } from './believer-ministry.entity';
import { GiftsService } from './gifts.service';

/**
 * Las dos tablas puente de un creyente: sus **labores** y sus **dones**.
 *
 * Se resuelven igual —se borra y se vuelve a escribir el juego entero, porque
 * son cuatro filas y el índice único ya impide repetir—, así que viven juntas
 * en vez de repetir el mismo baile en dos servicios (RFC 0003 §5.2).
 */
@Injectable()
export class BelieverLinksService {
  constructor(
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
    @InjectRepository(BelieverGift) private readonly gifts: Repository<BelieverGift>,
    private readonly catalog: GiftsService,
  ) {}

  async setMinistries(believerId: string, ministries: readonly string[]): Promise<void> {
    await this.ministries.delete({ believerId });
    if (ministries.length === 0) return;

    await this.ministries.save(
      ministries.map((ministry) => this.ministries.create({ believerId, ministry })),
    );
  }

  /** Los dones se comprueban antes: tienen que ser del catálogo de su iglesia. */
  async setGifts(churchId: string, believerId: string, giftIds: readonly string[]): Promise<void> {
    const gifts = await this.catalog.requireMany(churchId, giftIds);

    await this.gifts.delete({ believerId });
    if (gifts.length === 0) return;

    await this.gifts.save(gifts.map((gift) => this.gifts.create({ believerId, giftId: gift.id })));
  }

  /**
   * Le añade uno si no lo tenía, sin tocar el resto.
   *
   * Lo llama `BelieverNotesService` al guardar una nota de tipo «don»: anotar
   * que alguien lo recibió y que su ficha lo enseñe son la misma acción, no dos
   * (D8). Por eso acepta un `manager`: las dos escrituras van en la misma
   * transacción o no van.
   */
  async addGift(believerId: string, giftId: string, manager?: EntityManager): Promise<void> {
    const repository = manager?.getRepository(BelieverGift) ?? this.gifts;

    const already = await repository.findOne({ where: { believerId, giftId } });
    if (already) return;

    await repository.save(repository.create({ believerId, giftId }));
  }
}
