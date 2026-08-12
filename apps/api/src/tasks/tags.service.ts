import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateTagInput, UpdateTagInput } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { isUniqueViolation } from '../database/unique-violation';
import { Tag } from './tag.entity';

/**
 * El vocabulario de etiquetas de una cuenta, por iglesia (RFC 0018 §5.1, D12).
 * Mismo patrón que `EmotionsService` (RFC 0005 D6): se crea, se edita y se
 * borra igual, sin filas de serie.
 */
@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private readonly tags: Repository<Tag>) {}

  list(churchId: string, ownerId: string): Promise<Tag[]> {
    return this.tags.find({
      where: { churchId, ownerId },
      order: { position: 'ASC', createdAt: 'ASC' },
    });
  }

  async require(churchId: string, ownerId: string, id: string): Promise<Tag> {
    const tag = await this.tags.findOne({ where: { id, churchId, ownerId } });
    if (!tag) throw new NotFoundException('Esa etiqueta no existe');
    return tag;
  }

  /** Que todos esos identificadores sean etiquetas de la cuenta, o 404. */
  async requireAll(churchId: string, ownerId: string, ids: readonly string[]): Promise<void> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;

    const found = await this.tags.count({ where: { id: In(unique), churchId, ownerId } });
    if (found !== unique.length) throw new NotFoundException('Alguna etiqueta no existe');
  }

  async create(churchId: string, ownerId: string, input: CreateTagInput): Promise<Tag> {
    const position = await this.tags.count({ where: { churchId, ownerId } });

    try {
      return await this.tags.save(
        this.tags.create({
          churchId,
          ownerId,
          name: input.name,
          icon: input.icon,
          accent: input.accent,
          position,
        }),
      );
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Ya existe una etiqueta con ese nombre');
      throw error;
    }
  }

  async update(churchId: string, ownerId: string, id: string, input: UpdateTagInput): Promise<Tag> {
    const tag = await this.require(churchId, ownerId, id);
    if (input.name !== undefined) tag.name = input.name;
    if (input.icon !== undefined) tag.icon = input.icon;
    if (input.accent !== undefined) tag.accent = input.accent;

    try {
      return await this.tags.save(tag);
    } catch (error) {
      if (isUniqueViolation(error))
        throw new ConflictException('Ya existe una etiqueta con ese nombre');
      throw error;
    }
  }

  async remove(churchId: string, ownerId: string, id: string): Promise<void> {
    const tag = await this.require(churchId, ownerId, id);
    await this.tags.softRemove(tag);
  }
}
