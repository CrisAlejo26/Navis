import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Believer } from '../believers/believer.entity';
import { BelieversModule } from '../believers/believers.module';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { Congregation } from '../calendar/congregation.entity';
import { Church } from '../churches/church.entity';
import { ChurchesModule } from '../churches/churches.module';
import { MediaModule } from '../media/media.module';
import { ListAccessLog } from './list-access-log.entity';
import { ListAccessService } from './list-access.service';
import { ListAudienceService } from './list-audience.service';
import { ListDirectoryService } from './list-directory.service';
import { ListGrant } from './list-grant.entity';
import { ListGrantsService } from './list-grants.service';
import { ListMember } from './list-member.entity';
import { ListMemberStatsService } from './list-member-stats.service';
import { ListMembersController } from './list-members.controller';
import { ListMembersService } from './list-members.service';
import { ListOverlapService } from './list-overlap.service';
import { ListPasswordService } from './list-password.service';
import { ListRowsService } from './list-rows.service';
import { ListSessionsService } from './list-sessions.service';
import { ListShareController } from './list-share.controller';
import { ListShareService } from './list-share.service';
import { ListStatsService } from './list-stats.service';
import { ListView } from './list-view.entity';
import { ListViewer } from './list-viewer.entity';
import { ListViewersBulkService } from './list-viewers-bulk.service';
import { ListViewersController } from './list-viewers.controller';
import { ListViewersService } from './list-viewers.service';
import { ListViewsService } from './list-views.service';
import { List } from './list.entity';
import { ListsController } from './lists.controller';
import { ListsExportService } from './lists-export.service';
import { ListsSummaryService } from './lists-summary.service';
import { ListsService } from './lists.service';
import { PublicListsController } from './public-lists.controller';
import { PublicListsService } from './public-lists.service';
import { PublicShareController } from './public-share.controller';

/**
 * Las listas compartidas (RFC 0010).
 *
 * Es el único módulo con **dos superficies**: la privada, bajo `/api/v1` con
 * sesión y `ActiveChurchGuard`, y la pública, sin sesión —`/l/<token>` fuera del
 * prefijo y `/api/v1/public/lists/...`—. La raya que las separa es que las dos
 * autenticaciones no comparten nada: ni tabla, ni cookie, ni guard, ni servicio,
 * ni clave de firma (D22).
 *
 * `ListsController` se registra **antes** que `ListShareController` porque Nest
 * resuelve las rutas en el orden en que se declaran, y ahí vive `lists/:id`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      List,
      ListMember,
      ListViewer,
      ListGrant,
      ListView,
      ListAccessLog,
      Believer,
      Ministry,
      Gift,
      Congregation,
      Church,
    ]),
    ChurchesModule,
    BelieversModule,
    MediaModule,
  ],
  controllers: [
    ListsController,
    ListMembersController,
    ListShareController,
    ListViewersController,
    PublicListsController,
    PublicShareController,
  ],
  providers: [
    ListsService,
    ListsSummaryService,
    ListsExportService,
    ListRowsService,
    ListMembersService,
    ListShareService,
    ListGrantsService,
    ListSessionsService,
    ListPasswordService,
    ListViewersService,
    ListViewersBulkService,
    ListDirectoryService,
    ListAccessService,
    ListViewsService,
    ListAudienceService,
    ListMemberStatsService,
    ListOverlapService,
    ListStatsService,
    PublicListsService,
  ],
})
export class ListsModule {}
