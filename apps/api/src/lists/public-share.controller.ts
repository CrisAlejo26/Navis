import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  StreamableFile,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { listPublicPath } from '@navis/shared';

import { BelieverPhotosService } from '../believers/believer-photos.service';
import { Public } from '../common/decorators/public.decorator';
import { ImageStorageService } from '../media/image-storage.service';
import { ListAccessService } from './list-access.service';
import { listCookieFrom } from './list-access.cookie';
import { PublicListsService } from './public-lists.service';
import { parsePublicFields } from './public-fields';
import { originOf } from './request-origin';
import { applySharePageCsp } from './share-page-csp';
import { redirectScript, renderSharePage } from './share-page';

/**
 * `/l/<token>`: **lo que sirve la API fuera del prefijo** (RFC 0010 D14).
 *
 * Va `VERSION_NEUTRAL` y excluida de `setGlobalPrefix` en `main.ts`: con el
 * prefijo y el versionado por URI quedaría en `/api/v1/l/…` y el enlace dejaría
 * de ser el enlace. Es la misma decisión que ya está tomada para `/health`.
 */
@ApiExcludeController()
@Public()
@Controller({ path: 'l', version: VERSION_NEUTRAL })
export class PublicShareController {
  constructor(
    private readonly lists: PublicListsService,
    private readonly access: ListAccessService,
    private readonly photos: BelieverPhotosService,
    private readonly images: ImageStorageService,
  ) {}

  /** El documento con las `og:`. No cuenta como visita: el JSON sí (D31). */
  @Get(':token')
  async page(
    @Param('token') token: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<string> {
    const { list, churchName } = await this.lists.byToken(token);

    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.setHeader('x-robots-tag', 'noindex, nofollow');
    // Antes de escribir el cuerpo: el script de redirección necesita su hash
    // en el CSP, o el navegador lo bloquea (share-page-csp.ts).
    applySharePageCsp(request, response, redirectScript(listPublicPath(token)));

    return renderSharePage({
      origin: originOf(request),
      token,
      churchName,
      name: list.name,
      description: list.description,
      hasCover: Boolean(list.coverKey),
      // En restringida, la vista previa no lleva ni un nombre (D18).
      list:
        list.visibility === 'restricted' ? null : await this.lists.payload(list, churchName, null),
    });
  }

  @Get(':token/card.png')
  async card(
    @Param('token') token: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { list } = await this.lists.byToken(token);
    if (!list.coverKey) throw new NotFoundException('Esta lista no tiene portada');

    response.setHeader('cache-control', 'public, max-age=300');

    return new StreamableFile(this.images.read(list.coverKey), { type: 'image/png' });
  }

  /**
   * La foto de un miembro, con **sus cinco cierres** (D17): que el token vale,
   * que la lista está publicada y no caducada, que en modo restringido hay
   * cookie con concesión, que la foto está activada, y que ese creyente **está
   * en esta lista**. La última es la que impide usar el token de una lista para
   * sacar la foto de cualquiera.
   */
  @Get(':token/photos/:believerId')
  async photo(
    @Param('token') token: string,
    @Param('believerId') believerId: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<StreamableFile> {
    const { list } = await this.lists.byToken(token);

    if (list.visibility === 'restricted') {
      const viewer = await this.access.sessionFor(list, listCookieFrom(request.headers.cookie));
      if (!viewer) throw new NotFoundException('Esta lista ya no está disponible');
    }

    if (!parsePublicFields(list.publicFields).photo) {
      throw new NotFoundException('Esta lista no publica fotografías');
    }
    if (!(await this.lists.hasMember(list.id, believerId))) {
      throw new NotFoundException('Esa persona no está en esta lista');
    }

    const { file, mimeType } = await this.photos.stream(list.churchId, believerId);
    response.setHeader('cache-control', 'private, max-age=60');

    return new StreamableFile(file, { type: mimeType });
  }
}
