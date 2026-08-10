import type { DataSource, EntityManager } from 'typeorm';
import { FindOperator } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { BelieverGift } from '../believers/believer-gift.entity';
import { BelieverMinistry } from '../believers/believer-ministry.entity';
import { BelieverNote } from '../believers/believer-note.entity';
import { Believer } from '../believers/believer.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { NoteAudio } from '../believers/note-audio.entity';
import { Calendar } from '../calendar/calendar.entity';
import { Congregation } from '../calendar/congregation.entity';
import { Meeting } from '../calendar/meeting.entity';
import { MeetingPattern } from '../calendar/meeting-pattern.entity';
import { List } from '../lists/list.entity';
import { ListViewer } from '../lists/list-viewer.entity';
import type { FileScope } from '../media/file-storage.service';
import type { FileStorageService } from '../media/file-storage.service';
import { ChurchMember } from './church-member.entity';
import { Church } from './church.entity';
import { ChurchTransferService } from './church-transfer.service';

type Row = Record<string, unknown> & { id: string };

/**
 * Base de datos en memoria: solo lo que `ChurchTransferService` usa
 * (`find`, `count`, `exists`, `update`, `softRemove`, `remove`,
 * `findOneByOrFail`), tal y como pide la Regla 10 §2. Hace falta algo así de
 * completo —y no un `vi.fn` por método— porque el servicio recorre once
 * tablas dentro de una sola transacción: es la única forma de comprobar que
 * lo que fusiona una función es justo lo que otra reapunta.
 */
class BaseDeDatos {
  private readonly tablas = new Map<unknown, Row[]>();

  tabla(entidad: unknown): Row[] {
    if (!this.tablas.has(entidad)) this.tablas.set(entidad, []);
    return this.tablas.get(entidad) as Row[];
  }

  crea(entidad: unknown, fila: Row): Row {
    this.tabla(entidad).push(fila);
    return fila;
  }

  manager(): EntityManager {
    const coincide = (fila: Row, where?: Record<string, unknown>): boolean => {
      if (!where) return true;
      return Object.entries(where).every(([clave, valor]) => {
        if (valor instanceof FindOperator && valor.type === 'in') {
          return (valor.value as unknown[]).includes(fila[clave]);
        }
        return fila[clave] === valor;
      });
    };

    return {
      find: (entidad: unknown, opciones?: { where?: Record<string, unknown> }) =>
        Promise.resolve(this.tabla(entidad).filter((fila) => coincide(fila, opciones?.where))),
      count: (entidad: unknown, opciones?: { where?: Record<string, unknown> }) =>
        Promise.resolve(
          this.tabla(entidad).filter((fila) => coincide(fila, opciones?.where)).length,
        ),
      exists: async (entidad: unknown, opciones?: { where?: Record<string, unknown> }) =>
        this.tabla(entidad).some((fila) => coincide(fila, opciones?.where)),
      findOneByOrFail: (entidad: unknown, where: Record<string, unknown>) => {
        const fila = this.tabla(entidad).find((row) => coincide(row, where));
        if (!fila) throw new Error('No encontrado en la base de prueba');
        return Promise.resolve(fila);
      },
      update: (
        entidad: unknown,
        criterio: Record<string, unknown>,
        patch: Record<string, unknown>,
      ) => {
        for (const fila of this.tabla(entidad)) {
          if (coincide(fila, criterio)) Object.assign(fila, patch);
        }
        return Promise.resolve({ affected: 1 });
      },
      softRemove: (filas: Row | Row[]) => {
        for (const fila of Array.isArray(filas) ? filas : [filas]) fila.deletedAt = new Date();
        return Promise.resolve(filas);
      },
      remove: (filas: Row | Row[]) => {
        const lista = Array.isArray(filas) ? filas : [filas];
        for (const tabla of this.tablas.values()) {
          for (const fila of lista) {
            const indice = tabla.indexOf(fila);
            if (indice >= 0) tabla.splice(indice, 1);
          }
        }
        return Promise.resolve(filas);
      },
    } as unknown as EntityManager;
  }
}

function build() {
  const db = new BaseDeDatos();
  const manager = db.manager();

  const dataSource = {
    manager,
    transaction: (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
  } as unknown as DataSource;

  const movidos: { origen: string; destino: string }[] = [];
  const files = {
    // Doble a mano: el prefijo es siempre el id de la iglesia (Regla 10 §2).
    rekey: (clave: string, origen: FileScope, destino: FileScope) =>
      clave.replace((origen as { id: string }).id, (destino as { id: string }).id),
    moveScope: vi.fn((origen: FileScope, destino: FileScope) => {
      movidos.push({
        origen: (origen as { id: string }).id,
        destino: (destino as { id: string }).id,
      });
      return Promise.resolve(0);
    }),
  } as unknown as FileStorageService;

  const service = new ChurchTransferService(dataSource, files);
  return { service, db, movidos };
}

const fila = (extra: Row): Row => ({ deletedAt: null, ...extra });

describe('ChurchTransferService', () => {
  describe('impactOf', () => {
    it('cuenta lo que hay en cada tabla, sin tocar nada', async () => {
      const { service, db } = build();
      db.crea(Church, fila({ id: 'c1', name: 'IDMJI - Origen' }));
      db.crea(Believer, fila({ id: 'b1', churchId: 'c1' }));
      db.crea(Believer, fila({ id: 'b2', churchId: 'c1' }));
      db.crea(List, fila({ id: 'l1', churchId: 'c1' }));

      const impacto = await service.impactOf('c1');

      expect(impacto).toEqual({
        id: 'c1',
        name: 'IDMJI - Origen',
        believers: 2,
        notes: 0,
        lists: 1,
        calendars: 0,
        congregations: 0,
        members: 0,
      });
    });
  });

  describe('deleteAll', () => {
    it('pasa a deletedAt cada fila de la iglesia, y no toca las de otra', async () => {
      const { service, db } = build();
      db.crea(Church, fila({ id: 'c1', name: 'Origen' }));
      const propio = db.crea(Believer, fila({ id: 'b1', churchId: 'c1' }));
      const ajeno = db.crea(Believer, fila({ id: 'b9', churchId: 'otra' }));

      await service.deleteAll('c1');

      expect(propio.deletedAt).toBeInstanceOf(Date);
      expect(ajeno.deletedAt).toBeNull();
    });
  });

  describe('transferAll', () => {
    it('funde un don que ya existe en el destino y reapunta a quien lo tenía', async () => {
      const { service, db } = build();
      const destinoGift = db.crea(
        Gift,
        fila({ id: 'g-destino', churchId: 'destino', name: 'Sanidad' }),
      );
      const origenGift = db.crea(
        Gift,
        fila({ id: 'g-origen', churchId: 'origen', name: 'Sanidad' }),
      );
      const bg = db.crea(
        BelieverGift,
        fila({ id: 'bg1', believerId: 'b1', giftId: origenGift.id }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(bg.giftId).toBe(destinoGift.id);
      expect(origenGift.deletedAt).toBeInstanceOf(Date);
    });

    it('mueve un don que no existe todavía en el destino, sin fundirlo', async () => {
      const { service, db } = build();
      const gift = db.crea(Gift, fila({ id: 'g1', churchId: 'origen', name: 'Profecía' }));
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(gift.churchId).toBe('destino');
      expect(gift.deletedAt).toBeNull();
    });

    it('funde una labor por slug sin tocar believer_ministries: guarda el slug, no el id', async () => {
      const { service, db } = build();
      db.crea(Ministry, fila({ id: 'm-destino', churchId: 'destino', slug: 'pulpito' }));
      const origenMinistry = db.crea(
        Ministry,
        fila({ id: 'm-origen', churchId: 'origen', slug: 'pulpito' }),
      );
      const bm = db.crea(
        BelieverMinistry,
        fila({ id: 'bm1', believerId: 'b1', ministry: 'pulpito' }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(origenMinistry.deletedAt).toBeInstanceOf(Date);
      expect(bm.ministry).toBe('pulpito');
    });

    it('funde una sede por nombre y reapunta creyentes y reuniones', async () => {
      const { service, db } = build();
      const congDestino = db.crea(
        Congregation,
        fila({ id: 'cong-destino', churchId: 'destino', name: 'IDMJI - Murcia' }),
      );
      const congOrigen = db.crea(
        Congregation,
        fila({ id: 'cong-origen', churchId: 'origen', name: 'IDMJI - Murcia' }),
      );
      const creyente = db.crea(
        Believer,
        fila({ id: 'b1', churchId: 'origen', congregationId: congOrigen.id }),
      );
      const reunion = db.crea(
        Meeting,
        fila({ id: 'r1', churchId: 'origen', congregationId: congOrigen.id, calendarId: 'cal1' }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(creyente.churchId).toBe('destino');
      expect(creyente.congregationId).toBe(congDestino.id);
      expect(reunion.congregationId).toBe(congDestino.id);
      expect(congOrigen.deletedAt).toBeInstanceOf(Date);
    });

    it('mueve una sede sin pareja y la deja sin marca de "por defecto"', async () => {
      const { service, db } = build();
      const congOrigen = db.crea(
        Congregation,
        fila({ id: 'cong-origen', churchId: 'origen', name: 'Elda', isDefault: true }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(congOrigen.churchId).toBe('destino');
      expect(congOrigen.isDefault).toBe(false);
    });

    it('funde un calendario por slug y reapunta sus reuniones y patrones', async () => {
      const { service, db } = build();
      const calDestino = db.crea(
        Calendar,
        fila({ id: 'cal-destino', churchId: 'destino', slug: 'general' }),
      );
      const calOrigen = db.crea(
        Calendar,
        fila({ id: 'cal-origen', churchId: 'origen', slug: 'general' }),
      );
      const reunion = db.crea(
        Meeting,
        fila({ id: 'r1', churchId: 'origen', congregationId: 'x', calendarId: calOrigen.id }),
      );
      const patron = db.crea(
        MeetingPattern,
        fila({ id: 'p1', churchId: 'origen', congregationId: 'x', calendarId: calOrigen.id }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(reunion.calendarId).toBe(calDestino.id);
      expect(patron.calendarId).toBe(calDestino.id);
      expect(calOrigen.deletedAt).toBeInstanceOf(Date);
    });

    it('renombra una lista cuyo slug ya existe en el destino', async () => {
      const { service, db } = build();
      db.crea(
        List,
        fila({ id: 'l-destino', churchId: 'destino', slug: 'miembros', name: 'Miembros' }),
      );
      const listaOrigen = db.crea(
        List,
        fila({ id: 'l-origen', churchId: 'origen', slug: 'miembros', name: 'Miembros' }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(listaOrigen.churchId).toBe('destino');
      expect(listaOrigen.slug).toBe('miembros-2');
      expect(listaOrigen.name).toBe('Miembros-2');
    });

    // D4: quien ya es miembro de las dos iglesias no duplica su fila.
    it('no duplica la membresía de quien ya pertenece a las dos iglesias', async () => {
      const { service, db } = build();
      const propio = db.crea(
        ChurchMember,
        fila({ id: 'cm-origen', churchId: 'origen', userId: 'u1' }),
      );
      db.crea(ChurchMember, fila({ id: 'cm-destino', churchId: 'destino', userId: 'u1' }));
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(db.tabla(ChurchMember)).not.toContain(propio);
      expect(db.tabla(ChurchMember).filter((m) => m.userId === 'u1')).toHaveLength(1);
    });

    it('mueve la membresía de quien solo pertenecía a la iglesia de origen', async () => {
      const { service, db } = build();
      const membresia = db.crea(
        ChurchMember,
        fila({ id: 'cm1', churchId: 'origen', userId: 'u2' }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(membresia.churchId).toBe('destino');
    });

    it('reescribe la clave del audio y de la foto con el prefijo del destino', async () => {
      const { service, db } = build();
      const creyente = db.crea(
        Believer,
        fila({ id: 'b1', churchId: 'origen', photoKey: 'origen/foto.jpg' }),
      );
      db.crea(BelieverNote, fila({ id: 'n1', churchId: 'origen' }));
      const audio = db.crea(
        NoteAudio,
        fila({ id: 'a1', churchId: 'origen', storageKey: 'origen/audio.mp3' }),
      );
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(creyente.photoKey).toBe('destino/foto.jpg');
      expect(audio.storageKey).toBe('destino/audio.mp3');
    });

    it('mueve los ficheros de disco tras confirmar la transacción', async () => {
      const { service, db, movidos } = build();
      db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(movidos).toEqual([{ origen: 'origen', destino: 'destino' }]);
    });

    it('deja la iglesia de origen en deletedAt al terminar', async () => {
      const { service, db } = build();
      const origen = db.crea(Church, fila({ id: 'origen', name: 'Origen' }));

      await service.transferAll('origen', 'destino');

      expect(origen.deletedAt).toBeInstanceOf(Date);
    });
  });
});
