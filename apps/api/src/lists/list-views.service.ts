import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LIST_RETENTION_DAYS } from '@navis/shared';
import { LessThan, Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { ListAccessLog } from './list-access-log.entity';
import { ListView } from './list-view.entity';
import { deviceOf, ipPrefix, platformOf, referrerHost, visitorHash } from './visitor';

/** Media hora: si no, recargar cinco veces son cinco visitas (D33). */
const VENTANA_MS = 30 * 60_000;

export interface VisitContext {
  ip: string;
  userAgent: string;
  referrer?: string;
  viewerId?: string | null;
}

/**
 * Apuntar una visita, deduplicarla y podar lo viejo (RFC 0010 D31, D33, D34).
 *
 * Se apunta al servir **el JSON**, no el documento: el documento lo pide el
 * rastreador de WhatsApp cada vez que alguien pega el enlace en un chat, y
 * contar eso convertiría la métrica en ruido.
 */
@Injectable()
export class ListViewsService {
  constructor(
    @InjectRepository(ListView) private readonly views: Repository<ListView>,
    @InjectRepository(ListAccessLog) private readonly log: Repository<ListAccessLog>,
  ) {}

  async record(listId: string, context: VisitContext): Promise<void> {
    const now = new Date();
    const hash = visitorHash(toIsoDay(now), context.ip, context.userAgent);
    const viewerId = context.viewerId ?? null;

    /*
     * «Visitante» es el acceso cuando lo hay y el hash cuando no: en una lista
     * restringida, dos personas detrás del mismo router son dos visitantes si
     * entraron con accesos distintos (D33).
     */
    const reciente = await this.views.findOne({
      where: viewerId ? { listId, viewerId } : { listId, visitorHash: hash },
      order: { viewedAt: 'DESC' },
    });

    if (reciente && now.getTime() - reciente.viewedAt.getTime() < VENTANA_MS) {
      reciente.views += 1;
      reciente.viewedAt = now;
      await this.views.save(reciente);
      return;
    }

    await this.views.save(
      this.views.create({
        listId,
        viewerId,
        viewedAt: now,
        visitorHash: hash,
        ipPrefix: ipPrefix(context.ip),
        device: deviceOf(context.userAgent),
        platform: platformOf(context.userAgent),
        referrerHost: referrerHost(context.referrer),
        views: 1,
      }),
    );
  }

  /**
   * La poda de los 180 días. Corre al pedir las estadísticas, **como mucho una
   * vez al día**: la API no tiene programador de tareas y meter
   * `@nestjs/schedule` para esto sería una dependencia por un `DELETE` (D34).
   */
  async prune(): Promise<void> {
    const hoy = toIsoDay(new Date());
    if (hoy === podadoEl) return;
    podadoEl = hoy;

    const corte = new Date(Date.now() - LIST_RETENTION_DAYS * 86_400_000);
    await this.views.delete({ viewedAt: LessThan(corte) });
    await this.log.delete({ at: LessThan(corte) });
  }
}

/** La marca de la última poda, en memoria. Reiniciar la API la repite: es un `DELETE`. */
let podadoEl = '';
