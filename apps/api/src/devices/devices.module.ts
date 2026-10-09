import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Device } from './device.entity';
import { DeviceLink } from './device-link.entity';
import { DevicesController } from './devices.controller';
import { DevicesService } from './devices.service';

/** Global porque `SessionGuard` (en `AppModule`) resuelve las credenciales de dispositivo. */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([DeviceLink, Device])],
    controllers: [DevicesController],
    providers: [DevicesService],
    exports: [DevicesService],
})
export class DevicesModule {}
