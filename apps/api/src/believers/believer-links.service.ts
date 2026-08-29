import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type EntityManager } from 'typeorm';

import { BelieverGift } from './believer-gift.entity';
import { BelieverMinistry } from './believer-ministry.entity';
import { BelieverTagLink } from './believer-tag-link.entity';
import { BelieverTagsService } from './believer-tags.service';
import { GiftsService } from './gifts.service';

/**
 * Las tablas puente de un creyente: sus **labores**, sus **dones** y sus
 * **etiquetas**.
 *
 * Se resuelven igual —se borra y se vuelve a escribir el juego entero, porque
 * son cuatro filas y el índice único ya impide repetir—, así que viven juntas
 * en vez de repetir el mismo baile en tres servicios (RFC 0003 §5.2).
 */
@Injectable()
export class BelieverLinksService {
  constructor(
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
    @InjectRepository(BelieverGift) private readonly gifts: Repository<BelieverGift>,
    @InjectRepository(BelieverTagLink) private readonly tagLinks: Repository<BelieverTagLink>,
    private readonly catalog: GiftsService,
    private readonly tags: BelieverTagsService,
  ) {}

  /**
   * `dates` es un mapa por `slug`, y **manda la lista, no el mapa**: una fecha
   * de una labor que no está en `ministries` se cae aquí, que es lo que impide
   * que quede la fecha de algo que esa persona ya no hace (RFC 0012).
   */
  async setMinistries(
    believerId: string,
    ministries: readonly string[],
    dates: Readonly<Record<string, string | null>> = {},
  ): Promise<void> {
    await this.ministries.delete({ believerId });
    if (ministries.length === 0) return;

    await this.ministries.save(
      ministries.map((ministry) =>
        this.ministries.create({ believerId, ministry, startedAt: dates[ministry] ?? null }),
      ),
    );
  }

  /** Los dones se comprueban antes: tienen que ser del catálogo de su iglesia. */
  async setGifts(
    churchId: string,
    believerId: string,
    giftIds: readonly string[],
    dates: Readonly<Record<string, string | null>> = {},
  ): Promise<void> {
    const gifts = await this.catalog.requireMany(churchId, giftIds);

    await this.gifts.delete({ believerId });
    if (gifts.length === 0) return;

    await this.gifts.save(
      gifts.map((gift) =>
        this.gifts.create({ believerId, giftId: gift.id, receivedAt: dates[gift.id] ?? null }),
      ),
    );
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

  /**
   * Las etiquetas del creyente, con **una** destacada.
   *
   * Las etiquetas se comprueban antes: tienen que ser del catálogo de su
   * iglesia. Y el destacado **manda la lista, no la petición**: si llega uno
   * que no está entre las suyas —o se le quitó la etiqueta— se cae aquí, que
   * es lo que impide que la tabla enseñe una etiqueta que ya no tiene.
   */
  async setTags(
    churchId: string,
    believerId: string,
    tagIds: readonly string[],
    featuredTagId: string | null,
  ): Promise<void> {
    const tags = await this.tags.requireMany(churchId, tagIds);

    await this.tagLinks.delete({ believerId });
    if (tags.length === 0) return;

    const featured = tags.some((tag) => tag.id === featuredTagId) ? featuredTagId : null;

    await this.tagLinks.save(
      tags.map((tag) =>
        this.tagLinks.create({ believerId, tagId: tag.id, featured: tag.id === featured }),
      ),
    );
  }
}
