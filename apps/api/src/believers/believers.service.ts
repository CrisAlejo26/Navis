import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  believerName,
  DEFAULT_ALERT_AFTER_DAYS,
  DEFAULT_BELIEVER_STATUS,
  toSearchName,
  type BelieverListItem,
  type CreateBelieverInput,
  type IsoDate,
  type UpdateBelieverInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverHistoryService } from './believer-history.service';
import { BelieverLinksService } from './believer-links.service';
import { Believer } from './believer.entity';
import { giftsByBeliever, toListItem } from './believers.mapper';
import { GiftsService } from './gifts.service';

/**
 * La **ficha** de una persona de la iglesia (RFC 0003 §5.1): lo que se escribe.
 *
 * Continúa la tabla del núcleo mínimo de la RFC 0002 §6; no crea otra (D1). Lo
 * que se **lee** en el listado paginado está en `BelieversPageService`, y la
 * lista llana del calendario en `BelieversRosterService`.
 *
 * `lastNoteAt` **no se toca desde aquí**: es un dato derivado y lo escribe solo
 * `BelieverNotesService` (D4).
 */
@Injectable()
export class BelieversService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    private readonly links: BelieverLinksService,
    private readonly gifts: GiftsService,
    private readonly history: BelieverHistoryService,
  ) {}

  async create(churchId: string, input: CreateBelieverInput): Promise<Believer> {
    const believer = await this.believers.save(
      this.believers.create({
        churchId,
        congregationId: input.congregationId ?? null,
        firstName: input.firstName,
        lastName: input.lastName ?? '',
        phone: input.phone ?? null,
        email: input.email ?? null,
        status: input.status ?? DEFAULT_BELIEVER_STATUS,
        searchName: toSearchName(`${input.firstName} ${input.lastName ?? ''}`),
        alertAfterDays:
          input.alertAfterDays === undefined ? DEFAULT_ALERT_AFTER_DAYS : input.alertAfterDays,
        lastNoteAt: null,
        arrivedAt: input.arrivedAt ?? null,
        arrivalSite: input.arrivalSite ?? null,
        bibleReadings: input.bibleReadings ?? null,
        vivenciasReadings: input.vivenciasReadings ?? null,
        bibleInstituteTimes: input.bibleInstituteTimes ?? null,
      }),
    );

    await this.links.setMinistries(believer.id, input.ministries ?? [], input.ministryDates ?? {});
    await this.links.setGifts(churchId, believer.id, input.giftIds ?? [], input.giftDates ?? {});

    return this.require(churchId, believer.id);
  }

  async update(churchId: string, id: string, input: UpdateBelieverInput): Promise<Believer> {
    const believer = await this.require(churchId, id);

    if (input.firstName !== undefined) believer.firstName = input.firstName;
    if (input.lastName !== undefined) believer.lastName = input.lastName;
    if (input.phone !== undefined) believer.phone = input.phone;
    if (input.email !== undefined) believer.email = input.email;
    if (input.congregationId !== undefined) believer.congregationId = input.congregationId;
    if (input.status !== undefined) believer.status = input.status;
    if (input.alertAfterDays !== undefined) believer.alertAfterDays = input.alertAfterDays;
    if (input.arrivedAt !== undefined) believer.arrivedAt = input.arrivedAt;
    if (input.arrivalSite !== undefined) believer.arrivalSite = input.arrivalSite;
    if (input.bibleReadings !== undefined) believer.bibleReadings = input.bibleReadings;
    if (input.vivenciasReadings !== undefined) believer.vivenciasReadings = input.vivenciasReadings;
    if (input.bibleInstituteTimes !== undefined) {
      believer.bibleInstituteTimes = input.bibleInstituteTimes;
    }
    // Se recalcula siempre, aunque el nombre no venga en el cambio: es lo que
    // garantiza que lo guardado y lo buscado no divergen (D14).
    believer.searchName = toSearchName(believerName(believer));

    await this.believers.save(believer);
    if (input.ministries) {
      await this.links.setMinistries(believer.id, input.ministries, input.ministryDates ?? {});
    }
    if (input.giftIds) {
      await this.links.setGifts(churchId, believer.id, input.giftIds, input.giftDates ?? {});
    }

    return this.require(churchId, id);
  }

  async remove(churchId: string, id: string): Promise<void> {
    await this.believers.softRemove(await this.require(churchId, id));
  }

  /**
   * Pone la misma sede a varias personas de una vez.
   *
   * Existe porque quien se da de alta desde el selector de predicadores del
   * calendario nace **sin sede** —allí no se pregunta—, y ponérsela a treinta
   * hermanos abriendo treinta fichas es la clase de fricción que acaba en «ya
   * lo haré». Devuelve cuántas se han movido.
   *
   * El `where` lleva `churchId`: aunque llegase el identificador de alguien de
   * otra congregación, no se toca ni una fila suya.
   */
  async setCongregation(
    churchId: string,
    ids: readonly string[],
    congregationId: string | null,
  ): Promise<number> {
    // Los vacíos se caen aquí: un `IN ('')` contra una columna `uuid` revienta
    // en Postgres y a SQLite le da igual (CLAUDE.md).
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return 0;

    const result = await this.believers.update({ id: In(unique), churchId }, { congregationId });
    return result.affected ?? 0;
  }

  /** La ficha entera, comprobando que es de esta iglesia. 404 si no lo es. */
  async require(churchId: string, id: string): Promise<Believer> {
    const believer = await this.believers.findOne({
      where: { id, churchId },
      relations: { ministries: true, gifts: true },
    });
    if (!believer) throw new NotFoundException('Esa persona no está en esta iglesia');
    return believer;
  }

  /**
   * La ficha tal y como viaja: la misma forma que una fila del listado, con el
   * aviso y los dones ya resueltos (§7.5).
   *
   * Es una sola forma para las dos pantallas a propósito: así crear o editar
   * devuelve exactamente lo que la interfaz necesita para repintarse, sin
   * volver a pedir nada.
   */
  async detail(churchId: string, id: string, today: IsoDate): Promise<BelieverListItem> {
    const believer = await this.require(churchId, id);
    const [catalog, counts] = await Promise.all([
      this.gifts.ensureFor(churchId),
      this.history.countsOf(believer.id),
    ]);

    return toListItem({
      believer,
      ministries: (believer.ministries ?? []).map((one) => one.ministry),
      gifts: giftsByBeliever(believer.gifts ?? [], catalog).get(believer.id) ?? [],
      notesCount: counts.total,
      today,
    });
  }
}
