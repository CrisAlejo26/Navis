import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ACCENT_PALETTE,
  type CreateBelieverTagInput,
  type UpdateBelieverTagInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverTag } from './believer-tag.entity';

/**
 * El catálogo de **etiquetas de creyente** de una iglesia.
 *
 * Nace vacío —cada iglesia crea las suyas, como los dones y las labores se
 * renombran o se desactivan, pero no se borran si las tiene alguien—. No son
 * las etiquetas de tareas y hábitos (`tags`, RFC 0018): esas son de cada cuenta
 * y se cuelgan de tareas; estas son de la iglesia y se cuelgan de personas.
 */
@Injectable()
export class BelieverTagsService {
  constructor(@InjectRepository(BelieverTag) private readonly tags: Repository<BelieverTag>) {}

  list(churchId: string): Promise<BelieverTag[]> {
    return this.tags.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  async create(churchId: string, input: CreateBelieverTagInput): Promise<BelieverTag> {
    const existing = await this.list(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay una etiqueta con ese nombre');
    }

    return this.tags.save(
      this.tags.create({
        churchId,
        name: input.name,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        isSystem: false,
        isActive: true,
      }),
    );
  }

  async update(churchId: string, id: string, input: UpdateBelieverTagInput): Promise<BelieverTag> {
    const tag = await this.require(churchId, id);

    if (input.name !== undefined && input.name.toLowerCase() !== tag.name.toLowerCase()) {
      const taken = await this.list(churchId);
      if (
        taken.some((one) => one.id !== id && one.name.toLowerCase() === input.name?.toLowerCase())
      )
        throw new BadRequestException('Ya hay una etiqueta con ese nombre');
      tag.name = input.name;
    }

    if (input.accent !== undefined) tag.accent = input.accent;
    if (input.isActive !== undefined) tag.isActive = input.isActive;

    return this.tags.save(tag);
  }

  async remove(churchId: string, id: string): Promise<void> {
    const tag = await this.require(churchId, id);
    if (tag.isSystem) {
      throw new BadRequestException('Las etiquetas de serie no se borran; desactívalas');
    }

    await this.tags.softRemove(tag);
  }

  /** La etiqueta, comprobando que es de esta iglesia. 404 si no lo es. */
  async require(churchId: string, id: string): Promise<BelieverTag> {
    const tag = await this.tags.findOne({ where: { id, churchId } });
    if (!tag) throw new NotFoundException('Esa etiqueta no existe en esta iglesia');
    return tag;
  }

  /** Las que de verdad son de esta iglesia, de una sola consulta. */
  async requireMany(churchId: string, ids: readonly string[]): Promise<BelieverTag[]> {
    // Los vacíos se caen aquí: un `IN ('')` contra una columna `uuid` revienta
    // en Postgres y a SQLite le da igual (CLAUDE.md).
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return [];

    const found = await this.tags.find({ where: { churchId, id: In(unique) } });
    if (found.length !== unique.length) {
      throw new NotFoundException('Alguna de esas etiquetas no existe en esta iglesia');
    }

    return found;
  }
}

/** El primer color libre, para que dos etiquetas no nazcan del mismo. */
function freeAccent(existing: readonly BelieverTag[]): string {
  const used = new Set(existing.map((one) => one.accent));
  return ACCENT_PALETTE.find((accent) => !used.has(accent)) ?? ACCENT_PALETTE[0];
}
