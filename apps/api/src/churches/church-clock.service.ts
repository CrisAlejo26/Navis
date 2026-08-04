import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { todayIn, toIsoDate, type IsoDate } from '@navis/shared';
import { Repository } from 'typeorm';

import { Church } from './church.entity';

/**
 * Qué día es **hoy para esa iglesia**.
 *
 * No es lo mismo que el día del servidor: el aviso de inactividad cuenta días
 * de calendario (RFC 0003 §5.4) y una iglesia en Bogotá no cambia de día a la
 * vez que un contenedor en Fráncfort. Es el mismo motivo por el que una
 * programación es un día y no un instante (RFC 0002 §5.5).
 */
@Injectable()
export class ChurchClockService {
  constructor(@InjectRepository(Church) private readonly churches: Repository<Church>) {}

  async today(churchId: string, now = new Date()): Promise<IsoDate> {
    const church = await this.churches.findOne({ where: { id: churchId } });
    // Sin iglesia no hay huso; el día del servidor es mejor que ninguno.
    return church ? todayIn(church.timezone, now) : toIsoDate(now);
  }
}
