import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_PUBLIC_FIELDS,
  generateListShareToken,
  type ListShareState,
  type ShareListInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { churchScope } from '../media/file-storage.service';
import { ImageStorageService, type UploadedImage } from '../media/image-storage.service';
import { ListGrantsService } from './list-grants.service';
import { ListSessionsService } from './list-sessions.service';
import { List } from './list.entity';
import { ListsService } from './lists.service';
import { parsePublicFields, serializePublicFields } from './public-fields';

/**
 * Publicar, cambiar el enlace y dejar de compartir (RFC 0010 D8, D11, D12).
 *
 * Publicar y editar no son la misma acción, así que esto tiene permiso propio.
 * Y el estado vive **entero** aquí: `visibility` y `share_token` se escriben en
 * el mismo servicio y en la misma transacción, porque una lista publicada sin
 * token o un token sin publicar son estados que no significan nada.
 */
@Injectable()
export class ListShareService {
  constructor(
    @InjectRepository(List) private readonly lists: Repository<List>,
    private readonly listsService: ListsService,
    private readonly grants: ListGrantsService,
    private readonly sessions: ListSessionsService,
    private readonly images: ImageStorageService,
  ) {}

  async share(churchId: string, id: string, input: ShareListInput): Promise<ListShareState> {
    const list = await this.listsService.require(churchId, id);
    if (input.visibility === 'private') return this.unpublish(churchId, id);

    if (input.visibility === 'restricted' && (await this.grants.viewersOf(id)).length === 0) {
      throw new BadRequestException(
        'Una lista con acceso necesita al menos un acceso concedido: si no, no la abre nadie',
      );
    }

    /*
     * Pasar de **abierta a restringida rota el enlace obligatoriamente** (D12).
     * WhatsApp cachea la tarjeta por URL durante semanas y no hay forma de
     * decirle que la olvide: la única defensa real es que la URL deje de ser la
     * misma. Al revés no hace falta.
     */
    const rotar =
      !list.shareToken || (list.visibility === 'link' && input.visibility === 'restricted');

    if (rotar) list.shareToken = await this.freeToken();
    list.visibility = input.visibility;
    list.sharedAt ??= new Date();
    if (input.expiresAt !== undefined) {
      list.shareExpiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }
    if (input.allowDownload !== undefined) list.allowDownload = input.allowDownload;
    if (input.publicFields) {
      list.publicFields = serializePublicFields({
        ...DEFAULT_PUBLIC_FIELDS,
        ...parsePublicFields(list.publicFields),
        ...input.publicFields,
      });
    }

    return stateOf(await this.lists.save(list), rotar);
  }

  /** Mantiene la lista publicada y el modo: solo tira el token viejo (D11). */
  async rotate(churchId: string, id: string): Promise<ListShareState> {
    const list = await this.listsService.require(churchId, id);
    if (list.visibility === 'private') {
      throw new BadRequestException('Esa lista no está publicada');
    }

    list.shareToken = await this.freeToken();

    return stateOf(await this.lists.save(list), true);
  }

  /**
   * Dejar de compartir **mata el enlace de verdad**: el token se borra, las
   * sesiones abiertas se invalidan y la URL pasa a dar 404 —no un «esta lista ya
   * no está disponible», que también cuenta algo—. Volver a publicar da un token
   * nuevo (D11).
   */
  async unpublish(churchId: string, id: string): Promise<ListShareState> {
    const list = await this.listsService.require(churchId, id);

    list.visibility = 'private';
    list.shareToken = null;
    list.sharedAt = null;
    list.shareExpiresAt = null;

    const saved = await this.lists.save(list);
    await this.sessions.revoke(await this.grants.viewersOf(id));

    return stateOf(saved, false);
  }

  /** La portada de la tarjeta, compuesta y rasterizada por el navegador (D18). */
  async setCover(churchId: string, id: string, file: UploadedImage): Promise<void> {
    const list = await this.listsService.require(churchId, id);
    const previous = list.coverKey;

    const stored = await this.images.save(churchScope(churchId), file);
    list.coverKey = stored.storageKey;
    await this.lists.save(list);

    if (previous) await this.images.remove(previous);
  }

  private async freeToken(): Promise<string> {
    for (;;) {
      const token = generateListShareToken();
      if (!(await this.lists.exists({ where: { shareToken: token }, withDeleted: true }))) {
        return token;
      }
    }
  }
}

function stateOf(list: List, tokenRotated: boolean): ListShareState {
  return {
    visibility: list.visibility,
    shareToken: list.visibility === 'private' ? null : list.shareToken,
    sharedAt: list.sharedAt?.toISOString() ?? null,
    shareExpiresAt: list.shareExpiresAt?.toISOString() ?? null,
    tokenRotated,
  };
}
