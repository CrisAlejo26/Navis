import { Injectable } from '@nestjs/common';
import {
  believerName,
  EXPORT_MAX_ROWS,
  type ExportResponse,
  type ListExportRow,
} from '@navis/shared';

import { ListRowsService } from './list-rows.service';

/**
 * Las filas de una lista para exportarla (RFC 0010 D41).
 *
 * No hay nada más: una lista declara sus columnas en la web y los cinco
 * formatos del RFC 0009 salen solos. Es la prueba de que aquel juego estaba bien
 * puesto —si esto hubiera necesitado un sexto escritor, el de allí estaba mal—.
 */
@Injectable()
export class ListsExportService {
  constructor(private readonly rows: ListRowsService) {}

  async export(listId: string): Promise<ExportResponse<ListExportRow>> {
    const members = await this.rows.view(listId);
    const rows = members.slice(0, EXPORT_MAX_ROWS).map((member) => ({
      position: member.position + 1,
      name: believerName(member),
      congregation: member.congregationName,
      congregationAccent: member.congregationAccent,
      ministries: member.ministries,
      note: member.note,
      hasAccess: member.hasAccess,
    }));

    return {
      rows,
      total: members.length,
      returned: rows.length,
      truncated: members.length > rows.length,
    };
  }
}
