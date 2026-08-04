import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'nestjs-pino';

import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { BelieversModule } from './believers/believers.module';
import { CalendarModule } from './calendar/calendar.module';
import { ChurchesModule } from './churches/churches.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { SessionGuard } from './common/guards/session.guard';
import { env, isProduction } from './config/env';
import { dataSourceOptions } from './database/data-source';
import { HealthModule } from './health/health.module';
import { ProfilesModule } from './profiles/profiles.module';
import { RolesModule } from './roles/roles.module';
import { SetupModule } from './setup/setup.module';
import { UsersModule } from './users/users.module';
import { WeatherModule } from './weather/weather.module';

@Module({
  imports: [
    // El .env ya lo validó config/env.ts con zod; aquí solo lo exponemos a la DI.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => env] }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport: isProduction
          ? undefined
          : { target: 'pino-pretty', options: { singleLine: true } },
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        autoLogging: { ignore: (req) => req.url === '/health' },
      },
    }),

    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),

    TypeOrmModule.forRoot({ ...dataSourceOptions, autoLoadEntities: true }),

    AuthModule,
    ProfilesModule,
    ChurchesModule,
    BelieversModule,
    CalendarModule,
    RolesModule,
    UsersModule,
    SetupModule,
    HealthModule,
    AiModule,
    WeatherModule,
  ],
  providers: [
    // El orden importa: primero se resuelve la sesión, después los permisos.
    { provide: APP_GUARD, useClass: SessionGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
