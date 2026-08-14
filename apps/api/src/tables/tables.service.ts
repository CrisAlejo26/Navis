import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ACCENT_PALETTE,
  toSlug,
  type CreateCustomTableInput,
  type UpdateCustomTableInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { CustomTable } from './custom-table.entity';

/**
 * Las tablas personalizadas de una iglesia (RFC 0021 D1).
 *
 * No se siembra ninguna de serie —a diferencia de las cinco listas—: una
 * tabla nace vacía porque no hay forma de adivinar qué va a querer llevar
 * cada iglesia (RFC 0021 «Problema»).
 */
@Injectable()
export class TablesService {
  constructor(@InjectRepository(CustomTable) private readonly tables: Repository<CustomTable>) {}

  list(churchId: string): Promise<CustomTable[]> {
    return this.tables.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  async create(churchId: string, input: CreateCustomTableInput, by: string): Promise<CustomTable> {
    const existing = await this.list(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay una tabla con ese nombre');
    }

    return this.tables.save(
      this.tables.create({
        churchId,
        name: input.name,
        slug: await this.freeSlug(churchId, input.name),
        icon: input.icon,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        createdBy: by,
      }),
    );
  }

  /** Renombrar no cambia el `slug` (D7): es lo que hay en la URL. */
  async update(churchId: string, id: string, input: UpdateCustomTableInput): Promise<CustomTable> {
    const table = await this.require(churchId, id);

    if (input.name !== undefined && input.name.toLowerCase() !== table.name.toLowerCase()) {
      const existing = await this.list(churchId);
      if (
        existing.some(
          (one) => one.id !== id && one.name.toLowerCase() === input.name?.toLowerCase(),
        )
      ) {
        throw new BadRequestException('Ya hay una tabla con ese nombre');
      }
      table.name = input.name;
    }

    if (input.icon !== undefined) table.icon = input.icon;
    if (input.accent !== undefined) table.accent = input.accent;
    if (input.isActive !== undefined) table.isActive = input.isActive;
    if (input.position !== undefined) table.position = input.position;

    return this.tables.save(table);
  }

  async remove(churchId: string, id: string): Promise<void> {
    await this.tables.softRemove(await this.require(churchId, id));
  }

  async require(churchId: string, id: string): Promise<CustomTable> {
    const table = await this.tables.findOne({ where: { id, churchId } });
    if (!table) throw new NotFoundException('Esa tabla no existe en esta iglesia');
    return table;
  }

  private async freeSlug(churchId: string, name: string): Promise<string> {
    const base = toSlug(name, 40) || 'tabla';

    for (let intento = 1; ; intento += 1) {
      const slug = intento === 1 ? base : `${base}-${String(intento)}`;
      if (!(await this.tables.exists({ where: { churchId, slug } }))) return slug;
    }
  }
}

function freeAccent(existing: readonly CustomTable[]): string {
  const usados = new Set(existing.map((one) => one.accent));
  return (
    ACCENT_PALETTE.find((color) => !usados.has(color)) ??
    ACCENT_PALETTE[existing.length % ACCENT_PALETTE.length]
  );
}
