import { BadRequestException, Injectable } from '@nestjs/common';
import {
  extractTeachingBodyText,
  teachingBodySchema,
  toSearchName,
  type TeachingBody,
} from '@navis/shared';

import { parseTeachingBody } from './teachings.mapper';
import { TeachingsRepository } from './teachings.repository';
import type { Teaching } from './teaching.entity';

/** Lo que llega del DTO: `body` sin tipar todavía, se valida aquí (§4.2). */
export interface CreateTeachingCommand {
  title: string;
  body: Record<string, unknown>;
  receivedAt: string;
}

export interface UpdateTeachingCommand {
  title?: string;
  body?: Record<string, unknown>;
  receivedAt?: string;
}

/**
 * Alta, edición y borrado de una enseñanza (RFC 0022 §4.4).
 *
 * Todo pasa por `TeachingsRepository`, que exige el dueño: aquí no se
 * inyecta `Repository<Teaching>` (RFC 0004 D1).
 */
@Injectable()
export class TeachingsService {
  constructor(private readonly teachings: TeachingsRepository) {}

  get(ownerId: string, id: string): Promise<Teaching> {
    return this.teachings.require(ownerId, id);
  }

  // `async` a propósito: `parseBody` lanza, y sin ello lo haría de forma
  // síncrona al llamar al método en vez de rechazando la promesa (CLAUDE.md).
  async create(ownerId: string, input: CreateTeachingCommand): Promise<Teaching> {
    const body = parseBody(input.body);

    return this.teachings.save(
      this.teachings.create(ownerId, {
        title: input.title,
        bodyJson: JSON.stringify(body),
        searchText: toSearchText(input.title, body),
        receivedAt: input.receivedAt,
      }),
    );
  }

  async update(ownerId: string, id: string, input: UpdateTeachingCommand): Promise<Teaching> {
    const teaching = await this.teachings.require(ownerId, id);

    if (input.title !== undefined) teaching.title = input.title;
    if (input.body !== undefined) teaching.bodyJson = JSON.stringify(parseBody(input.body));
    if (input.title !== undefined || input.body !== undefined) {
      teaching.searchText = toSearchText(teaching.title, parseTeachingBody(teaching.bodyJson));
    }
    if (input.receivedAt !== undefined) teaching.receivedAt = input.receivedAt;

    return this.teachings.save(teaching);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.teachings.softRemove(await this.teachings.require(ownerId, id));
  }
}

/**
 * Lo que llega del cliente contra el whitelist del editor (§4.2). Un 400 y no
 * un 500: es una entrada que se puede corregir, no un fallo del servidor.
 */
function parseBody(raw: Record<string, unknown>): TeachingBody {
  const parsed = teachingBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new BadRequestException(parsed.error.issues[0]?.message ?? 'El texto no es válido');
  }
  return parsed.data;
}

/** Lo que se guarda en `search_text`: título y texto plano del cuerpo, normalizados. */
export function toSearchText(title: string, body: TeachingBody): string {
  // La misma normalización que `search_name` de creyentes y `search_text` de
  // profecías, y a propósito: si divergieran, una de las búsquedas dejaría de
  // encontrar acentos.
  return toSearchName(`${title} ${extractTeachingBodyText(body).text}`);
}
