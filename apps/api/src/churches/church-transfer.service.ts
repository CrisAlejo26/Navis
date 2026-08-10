import { Injectable } from '@nestjs/common';
import type { OwnedChurchImpact } from '@navis/shared';
import { DataSource } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { BelieverNote } from '../believers/believer-note.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { NoteAudio } from '../believers/note-audio.entity';
import { Calendar } from '../calendar/calendar.entity';
import { Congregation } from '../calendar/congregation.entity';
import { List } from '../lists/list.entity';
import { ListViewer } from '../lists/list-viewer.entity';
import { churchScope, FileStorageService } from '../media/file-storage.service';
import { ChurchMember } from './church-member.entity';
import { Church } from './church.entity';
import {
  mergeCalendars,
  mergeCongregations,
  mergeGifts,
  mergeMinistries,
} from './church-transfer-catalogs';
import { moveMembers, renameListViewers, renameLists } from './church-transfer-rename';

/**
 * Qué pasa con una iglesia entera al dar de baja a quien la dirige (RFC 0015).
 *
 * Dos destinos, nunca una mezcla: **eliminar** pasa todo a `deletedAt` sin
 * tocar disco (D5); **trasladar** funde cada catálogo de serie con el del
 * destino —`ensureFor` siembra los mismos en cada iglesia nueva, así que el
 * choque de único es el caso normal, no el raro— y mueve el resto (D3).
 *
 * Sin `forFeature` de estas entidades ni import de sus módulos: crearía un
 * ciclo con `ChurchesModule`. Se llega a ellas con las clases de entidad y el
 * `EntityManager` de la transacción, como ya hace `believer-notes.service.ts`.
 */
@Injectable()
export class ChurchTransferService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly files: FileStorageService,
  ) {}

  /** Cuánto se lleva por delante, para el 409 que pide decidir (D2). */
  async impactOf(churchId: string): Promise<OwnedChurchImpact> {
    const manager = this.dataSource.manager;
    const church = await manager.findOneByOrFail(Church, { id: churchId });

    const [believers, notes, lists, calendars, congregations, members] = await Promise.all([
      manager.count(Believer, { where: { churchId } }),
      manager.count(BelieverNote, { where: { churchId } }),
      manager.count(List, { where: { churchId } }),
      manager.count(Calendar, { where: { churchId } }),
      manager.count(Congregation, { where: { churchId } }),
      manager.count(ChurchMember, { where: { churchId } }),
    ]);

    return {
      id: church.id,
      name: church.name,
      believers,
      notes,
      lists,
      calendars,
      congregations,
      members,
    };
  }

  /**
   * Todo a `deletedAt`, en el orden que evita dejar una referencia colgando a
   * mitad de la transacción. Los ficheros de disco se quedan (D5): borrarlos
   * es irreversible, y esta aplicación no borra nada irreversible.
   */
  async deleteAll(churchId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager.softRemove(await manager.find(NoteAudio, { where: { churchId } }));
      await manager.softRemove(await manager.find(BelieverNote, { where: { churchId } }));
      await manager.softRemove(await manager.find(Believer, { where: { churchId } }));
      await manager.softRemove(await manager.find(Calendar, { where: { churchId } }));
      await manager.softRemove(await manager.find(Congregation, { where: { churchId } }));
      await manager.softRemove(await manager.find(Ministry, { where: { churchId } }));
      await manager.softRemove(await manager.find(Gift, { where: { churchId } }));
      await manager.softRemove(await manager.find(ListViewer, { where: { churchId } }));
      await manager.softRemove(await manager.find(List, { where: { churchId } }));
      await manager.softRemove(await manager.find(ChurchMember, { where: { churchId } }));
      await manager.softRemove(await manager.findOneByOrFail(Church, { id: churchId }));
    });
  }

  /**
   * Funde los catálogos, mueve el resto y reescribe las claves de disco dentro
   * de la **misma** transacción; los ficheros se mueven después, porque no hay
   * forma de que el movimiento de disco entre en la transacción de la base.
   */
  async transferAll(origenId: string, destinoId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      // Capturados antes de tocar nada: una vez fundida una sede, el creyente
      // que colgaba de ella ya tiene otro `churchId`, y filtrar por el de
      // origen dejaría fuera su clave de foto.
      const believers = await manager.find(Believer, { where: { churchId: origenId } });
      const noteAudios = await manager.find(NoteAudio, { where: { churchId: origenId } });

      await mergeGifts(manager, origenId, destinoId);
      await mergeMinistries(manager, origenId, destinoId);
      await mergeCongregations(manager, origenId, destinoId);
      await mergeCalendars(manager, origenId, destinoId);
      await renameLists(manager, origenId, destinoId);
      await renameListViewers(manager, origenId, destinoId);
      await moveMembers(manager, origenId, destinoId);

      // Lo que queda: creyentes sin sede (el resto ya se movió al fundir la
      // suya) y las notas, que no tienen ninguna restricción única que mirar.
      await manager.update(Believer, { churchId: origenId }, { churchId: destinoId });
      await manager.update(BelieverNote, { churchId: origenId }, { churchId: destinoId });
      await manager.update(NoteAudio, { churchId: origenId }, { churchId: destinoId });

      for (const believer of believers) {
        if (!believer.photoKey) continue;
        const photoKey = this.files.rekey(
          believer.photoKey,
          churchScope(origenId),
          churchScope(destinoId),
        );
        await manager.update(Believer, { id: believer.id }, { photoKey });
      }
      for (const audio of noteAudios) {
        const storageKey = this.files.rekey(
          audio.storageKey,
          churchScope(origenId),
          churchScope(destinoId),
        );
        await manager.update(NoteAudio, { id: audio.id }, { storageKey });
      }

      await manager.softRemove(await manager.findOneByOrFail(Church, { id: origenId }));
    });

    await this.files.moveScope(churchScope(origenId), churchScope(destinoId));
  }
}
