import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ACCENT_PALETTE,
  SYSTEM_GIFTS,
  type CreateGiftInput,
  type UpdateGiftInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Gift } from './gift.entity';

/**
 * El catálogo de **dones** de una iglesia (RFC 0003 D5).
 *
 * Los siete de serie se renombran y se desactivan, pero no se borran: son el
 * suelo común del vocabulario. Los que añada la iglesia sí.
 */
@Injectable()
export class GiftsService {
  constructor(@InjectRepository(Gift) private readonly gifts: Repository<Gift>) {}

  list(churchId: string): Promise<Gift[]> {
    return this.gifts.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  /**
   * El catálogo, **garantizando que existe**.
   *
   * La migración se lo dio a las iglesias que ya había; una creada después
   * nacería sin ninguno. Se resuelve aquí y no en `ChurchesService` para no
   * invertir la dependencia entre módulos, igual que con las sedes (RFC 0002).
   */
  async ensureFor(churchId: string): Promise<Gift[]> {
    const existing = await this.list(churchId);
    if (existing.length > 0) return existing;

    await this.gifts.save(
      SYSTEM_GIFTS.map((name, position) =>
        this.gifts.create({
          churchId,
          name,
          accent: ACCENT_PALETTE[position % ACCENT_PALETTE.length],
          position,
          isSystem: true,
          isActive: true,
        }),
      ),
    );

    return this.list(churchId);
  }

  async create(churchId: string, input: CreateGiftInput): Promise<Gift> {
    const existing = await this.ensureFor(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay un don con ese nombre');
    }

    return this.gifts.save(
      this.gifts.create({
        churchId,
        name: input.name,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        isSystem: false,
        isActive: true,
      }),
    );
  }

  async update(churchId: string, id: string, input: UpdateGiftInput): Promise<Gift> {
    const gift = await this.require(churchId, id);

    if (input.name !== undefined && input.name.toLowerCase() !== gift.name.toLowerCase()) {
      const taken = await this.list(churchId);
      if (
        taken.some((one) => one.id !== id && one.name.toLowerCase() === input.name?.toLowerCase())
      )
        throw new BadRequestException('Ya hay un don con ese nombre');
      gift.name = input.name;
    }

    if (input.accent !== undefined) gift.accent = input.accent;
    if (input.isActive !== undefined) gift.isActive = input.isActive;

    return this.gifts.save(gift);
  }

  async remove(churchId: string, id: string): Promise<void> {
    const gift = await this.require(churchId, id);
    if (gift.isSystem) {
      throw new BadRequestException('Los dones de serie no se borran; desactívalos');
    }

    await this.gifts.softRemove(gift);
  }

  /** El don, comprobando que es de esta iglesia. 404 si no lo es. */
  async require(churchId: string, id: string): Promise<Gift> {
    const gift = await this.gifts.findOne({ where: { id, churchId } });
    if (!gift) throw new NotFoundException('Ese don no existe en esta iglesia');
    return gift;
  }

  /** Los que de verdad son de esta iglesia, de una sola consulta. */
  async requireMany(churchId: string, ids: readonly string[]): Promise<Gift[]> {
    // Los vacíos se caen aquí: un `IN ('')` contra una columna `uuid` revienta
    // en Postgres y a SQLite le da igual (CLAUDE.md).
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return [];

    const found = await this.gifts.find({ where: { churchId, id: In(unique) } });
    if (found.length !== unique.length) {
      throw new NotFoundException('Alguno de esos dones no existe en esta iglesia');
    }

    return found;
  }
}

/** El primer color libre, para que dos dones no nazcan del mismo. */
function freeAccent(existing: readonly Gift[]): string {
  const used = new Set(existing.map((one) => one.accent));
  return ACCENT_PALETTE.find((accent) => !used.has(accent)) ?? ACCENT_PALETTE[0];
}
