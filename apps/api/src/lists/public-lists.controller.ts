import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiExcludeController } from '@nestjs/swagger';
import type { PublicList } from '@navis/shared';
import type { Request, Response } from 'express';

import { Public } from '../common/decorators/public.decorator';
import { PublicListAccessDto } from './dto/public-access.dto';
import { ListAccessService } from './list-access.service';
import {
  LIST_COOKIE,
  LIST_COOKIE_OPTIONS,
  issueListCookie,
  listCookieFrom,
} from './list-access.cookie';
import { ListViewsService } from './list-views.service';
import { PublicListsService } from './public-lists.service';

/**
 * El JSON de una lista publicada (RFC 0010 §7.3).
 *
 * Sin sesión y con su propio freno, más estrecho que el general. En modo
 * restringido, sin cookie válida devuelve **401 con lo mínimo para pintar la
 * puerta**: el nombre de la iglesia, el de la lista y su color, y nada más —ni
 * el número de personas, ni una sola inicial— (§8.6).
 */
@ApiExcludeController()
@Public()
@Controller('public/lists')
export class PublicListsController {
  constructor(
    private readonly lists: PublicListsService,
    private readonly access: ListAccessService,
    private readonly views: ListViewsService,
  ) {}

  @Get(':token')
  @Throttle({ default: { ttl: 60_000, limit: 60 } })
  async get(
    @Param('token') token: string,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicList> {
    const { list, churchName } = await this.lists.byToken(token);

    response.setHeader('cache-control', 'no-store');
    if (list.visibility === 'restricted') response.setHeader('vary', 'Cookie');

    const viewer =
      list.visibility === 'restricted'
        ? await this.access.sessionFor(list, listCookieFrom(request.headers.cookie))
        : null;

    if (list.visibility === 'restricted' && !viewer) {
      // El 401 lleva **lo mínimo** para pintar la puerta: la iglesia, el nombre
      // de la lista y su color. Ni el número de personas, ni una inicial (§8.6).
      throw new UnauthorizedException({
        message: 'Hace falta un acceso para ver esta lista',
        data: this.lists.gate(list, churchName),
      });
    }

    // La visita se apunta **al servir el JSON**, que lo pide el navegador de una
    // persona; el documento lo pide el rastreador de WhatsApp (D31).
    await this.views.record(list.id, {
      ip: request.ip ?? '',
      userAgent: request.get('user-agent') ?? '',
      referrer: request.get('referer') ?? undefined,
      viewerId: viewer?.id ?? null,
    });

    return this.lists.payload(list, churchName, viewer);
  }

  /** Usuario y contraseña. Su freno propio va además por prefijo de IP (D27). */
  @Post(':token/access')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async enter(
    @Param('token') token: string,
    @Body() dto: PublicListAccessDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PublicList> {
    const { list, churchName } = await this.lists.byToken(token);
    const viewer = await this.access.enter(list, dto, request.ip ?? '');

    response.cookie(LIST_COOKIE, issueListCookie(viewer.id), LIST_COOKIE_OPTIONS);
    response.setHeader('cache-control', 'no-store');

    await this.views.record(list.id, {
      ip: request.ip ?? '',
      userAgent: request.get('user-agent') ?? '',
      referrer: request.get('referer') ?? undefined,
      viewerId: viewer.id,
    });

    return this.lists.payload(list, churchName, viewer);
  }

  /** Sin esto, en un teléfono prestado nadie sabe con qué llave está entrando. */
  @Post(':token/exit')
  @HttpCode(204)
  exit(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(LIST_COOKIE, { ...LIST_COOKIE_OPTIONS, maxAge: undefined });
  }
}
