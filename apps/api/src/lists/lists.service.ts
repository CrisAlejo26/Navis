import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ACCENT_PALETTE,
  SEEDED_LISTS,
  toSlug,
  type CreateListInput,
  type UpdateListInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Ministry } from '../believers/ministry.entity';
import { ListGrantsService } from './list-grants.service';
import { List } from './list.entity';

/**
 * Las listas de una iglesia (RFC 0010 D1).
 *
 * Se siembran **a la primera consulta** y no solo en la migración —igual que el
 * catálogo de dones y el de labores—, para que una iglesia creada después no
 * nazca sin ninguna. El color de cada una es el de su labor cuando existe (D4):
 * así «Púlpito» es del mismo color en el calendario, en la etiqueta de un
 * creyente y en su lista.
 */
@Injectable()
export class ListsService {
  constructor(
    @InjectRepository(List) private readonly lists: Repository<List>,
    @InjectRepository(Ministry) private readonly ministries: Repository<Ministry>,
    private readonly grants: ListGrantsService,
  ) {}

  list(churchId: string): Promise<List[]> {
    return this.lists.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  async ensureFor(churchId: string): Promise<List[]> {
    const existing = await this.list(churchId);
    if (existing.length > 0) return existing;

    const accents = new Map(
      (await this.ministries.find({ where: { churchId } })).map((one) => [one.slug, one.accent]),
    );

    await this.lists.save(
      SEEDED_LISTS.map((one, position) =>
        this.lists.create({
          churchId,
          name: one.name,
          slug: one.slug,
          accent: accents.get(one.ministry) ?? ACCENT_PALETTE[position % ACCENT_PALETTE.length],
          position,
          visibility: 'private',
        }),
      ),
    );

    return this.list(churchId);
  }

  async create(churchId: string, input: CreateListInput, by: string): Promise<List> {
    const existing = await this.ensureFor(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay una lista con ese nombre');
    }

    return this.lists.save(
      this.lists.create({
        churchId,
        name: input.name,
        slug: await this.freeSlug(churchId, input.name),
        description: input.description ?? null,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        visibility: 'private',
        createdBy: by,
      }),
    );
  }

  /**
   * Renombrar **no cambia el `slug`**: es lo que hay en la URL y en los enlaces
   * que alguien tenga guardados (D7). Cambia el nombre, que es lo que se lee.
   */
  async update(churchId: string, id: string, input: UpdateListInput): Promise<List> {
    const list = await this.require(churchId, id);

    if (input.name !== undefined && input.name.toLowerCase() !== list.name.toLowerCase()) {
      const existing = await this.list(churchId);
      if (
        existing.some(
          (one) => one.id !== id && one.name.toLowerCase() === input.name?.toLowerCase(),
        )
      ) {
        throw new BadRequestException('Ya hay una lista con ese nombre');
      }
      list.name = input.name;
    }

    if (input.description !== undefined) list.description = input.description || null;
    if (input.accent !== undefined) list.accent = input.accent;
    if (input.isActive !== undefined) list.isActive = input.isActive;
    if (input.position !== undefined) list.position = input.position;
    if (input.allowDownload !== undefined) list.allowDownload = input.allowDownload;

    return this.lists.save(list);
  }

  /**
   * Borrado lógico, y antes **despublica**: el enlace deja de funcionar, las
   * concesiones se quitan a mano —el `CASCADE` no se dispara con borrado
   * lógico— y con ellas se cortan las sesiones abiertas (§6.4, D11).
   */
  async remove(churchId: string, id: string): Promise<void> {
    const list = await this.require(churchId, id);

    list.visibility = 'private';
    list.shareToken = null;
    list.sharedAt = null;
    await this.lists.save(list);

    await this.grants.removeAllOf({ listId: id });
    await this.lists.softRemove(list);
  }

  async require(churchId: string, id: string): Promise<List> {
    const list = await this.lists.findOne({ where: { id, churchId } });
    if (!list) throw new NotFoundException('Esa lista no existe en esta iglesia');
    return list;
  }

  /**
   * De esos identificadores, los que **son de esta iglesia**.
   *
   * Sin este filtro, un identificador inventado en el cuerpo de un `PUT` de
   * concesiones daría acceso a la lista de otra congregación.
   */
  async ownedIds(churchId: string, ids: readonly string[]): Promise<string[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) return [];

    const suyas = await this.lists.find({
      where: { id: In(unicos), churchId },
      select: { id: true },
    });

    return suyas.map((one) => one.id);
  }

  /** `pulpito`, `pulpito-2`… Dos listas pueden llamarse casi igual. */
  private async freeSlug(churchId: string, name: string): Promise<string> {
    const base = toSlug(name, 40) || 'lista';

    for (let intento = 1; ; intento += 1) {
      const slug = intento === 1 ? base : `${base}-${String(intento)}`;
      if (!(await this.lists.exists({ where: { churchId, slug } }))) return slug;
    }
  }
}

/** Al crear se propone un color que no esté usado; repetirlo se permite (D37). */
function freeAccent(existing: readonly List[]): string {
  const usados = new Set(existing.map((one) => one.accent));
  return (
    ACCENT_PALETTE.find((color) => !usados.has(color)) ??
    ACCENT_PALETTE[existing.length % ACCENT_PALETTE.length]
  );
}
