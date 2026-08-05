import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ACCENT_PALETTE,
  SYSTEM_MINISTRIES,
  toMinistrySlug,
  type CreateMinistryInput,
  type UpdateMinistryInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { Ministry } from './ministry.entity';

/**
 * El catálogo de **labores** de una iglesia.
 *
 * Gemelo del de dones y por el mismo motivo: es vocabulario de la iglesia, no
 * una lista fija del programa. Las siete de serie se renombran y se desactivan,
 * pero no se borran; las que añada la iglesia sí.
 *
 * La diferencia con los dones es el `slug`: se genera del nombre al crear y
 * **no cambia al renombrar**, porque es lo que está guardado en cada persona y
 * lo que mira el calendario. Renombrar «Púlpito» a «Predicación» cambia el
 * rótulo, no a quién estaba disponible para predicar.
 */
@Injectable()
export class MinistriesService {
  constructor(@InjectRepository(Ministry) private readonly ministries: Repository<Ministry>) {}

  list(churchId: string): Promise<Ministry[]> {
    return this.ministries.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  /**
   * El catálogo, **garantizando que existe**.
   *
   * Igual que con los dones: se siembra a la primera consulta y no en una
   * migración, así una iglesia creada después no nace sin ninguna.
   */
  async ensureFor(churchId: string): Promise<Ministry[]> {
    const existing = await this.list(churchId);
    if (existing.length > 0) return existing;

    await this.ministries.save(
      SYSTEM_MINISTRIES.map((one, position) =>
        this.ministries.create({
          churchId,
          slug: one.slug,
          name: one.name,
          accent: ACCENT_PALETTE[position % ACCENT_PALETTE.length],
          position,
          isSystem: true,
          isActive: true,
        }),
      ),
    );

    return this.list(churchId);
  }

  async create(churchId: string, input: CreateMinistryInput): Promise<Ministry> {
    const existing = await this.ensureFor(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay una labor con ese nombre');
    }

    return this.ministries.save(
      this.ministries.create({
        churchId,
        slug: freeSlug(input.name, existing),
        name: input.name,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        isSystem: false,
        isActive: true,
      }),
    );
  }

  async update(churchId: string, id: string, input: UpdateMinistryInput): Promise<Ministry> {
    const ministry = await this.require(churchId, id);

    if (input.name !== undefined && input.name.toLowerCase() !== ministry.name.toLowerCase()) {
      const taken = await this.list(churchId);
      if (
        taken.some((one) => one.id !== id && one.name.toLowerCase() === input.name?.toLowerCase())
      ) {
        throw new BadRequestException('Ya hay una labor con ese nombre');
      }
      // El slug **no** se toca: está guardado en cada persona (ver arriba).
      ministry.name = input.name;
    }

    if (input.accent !== undefined) ministry.accent = input.accent;
    if (input.isActive !== undefined) ministry.isActive = input.isActive;

    return this.ministries.save(ministry);
  }

  async remove(churchId: string, id: string): Promise<void> {
    const ministry = await this.require(churchId, id);
    if (ministry.isSystem) {
      throw new BadRequestException('Las labores de serie no se borran; desactívalas');
    }

    await this.ministries.softRemove(ministry);
  }

  /** La labor, comprobando que es de esta iglesia. 404 si no lo es. */
  async require(churchId: string, id: string): Promise<Ministry> {
    const ministry = await this.ministries.findOne({ where: { id, churchId } });
    if (!ministry) throw new NotFoundException('Esa labor no existe en esta iglesia');
    return ministry;
  }
}

/** El primer color libre, para que dos labores no nazcan del mismo. */
function freeAccent(existing: readonly Ministry[]): string {
  const used = new Set(existing.map((one) => one.accent));
  return ACCENT_PALETTE.find((accent) => !used.has(accent)) ?? ACCENT_PALETTE[0];
}

/**
 * Un slug que no esté cogido. Dos nombres distintos pueden dar el mismo
 * —«Ofrenda» y «ofrenda.»—, y el índice único lo rechazaría con un error de
 * base de datos en vez de con un mensaje.
 */
function freeSlug(name: string, existing: readonly Ministry[]): string {
  const base = toMinistrySlug(name) || 'labor';
  const used = new Set(existing.map((one) => one.slug));
  if (!used.has(base)) return base;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base}-${String(suffix)}`;
    if (!used.has(candidate)) return candidate;
  }

  return `${base}-${String(Date.now())}`.slice(0, 40);
}
