import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchMember } from '../churches/church-member.entity';
import { RolesModule } from '../roles/roles.module';
import { SyncAdapterRegistry } from './sync-adapter-registry';
import { SyncChange } from './sync-change.entity';
import { SyncChangesService } from './sync-changes.service';
import { SyncInstallation } from './sync-installation.entity';
import { SyncInstallationService } from './sync-installation.service';
import { SyncOperationsService } from './sync-operations.service';
import { SyncPublisher } from './sync-publisher.service';
import { SyncRetentionService } from './sync-retention.service';
import { SyncReceipt } from './sync-receipt.entity';
import { SyncRevision } from './sync-revision.entity';
import { SyncController } from './sync.controller';

/** Global: los módulos de dominio registran su adaptador en `SyncAdapterRegistry` (Fase 8). */
@Global()
@Module({
    imports: [
        RolesModule,
        TypeOrmModule.forFeature([
            SyncChange,
            SyncRevision,
            SyncReceipt,
            SyncInstallation,
            ChurchMember,
        ]),
    ],
    controllers: [SyncController],
    providers: [
        SyncAdapterRegistry,
        SyncPublisher,
        SyncInstallationService,
        SyncChangesService,
        SyncOperationsService,
        SyncRetentionService,
    ],
    exports: [SyncAdapterRegistry],
})
export class SyncModule {}
