import 'reflect-metadata';

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import { auth } from './auth/auth';
import { env, isProduction } from './config/env';

async function bootstrap(): Promise<void> {
  // bodyParser: false es obligatorio — Better Auth necesita leer el cuerpo
  // crudo de la petición, así que su handler se monta ANTES del parser JSON.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Detrás de nginx o Traefik, la IP real viaja en X-Forwarded-For: sin esto,
  // el limitador de peticiones ve a todo el mundo como la misma IP.
  if (env.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true, // imprescindible para la cookie de sesión
  });

  // 1) Better Auth: /api/auth/**  (sign-up, sign-in, sesión, OAuth…)
  app.use('/api/auth', toNodeHandler(auth));

  // 2) A partir de aquí sí queremos el cuerpo parseado.
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.setGlobalPrefix(env.API_PREFIX, { exclude: ['health'] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: env.API_VERSION });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();

  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Fidus API')
      .setDescription(
        'API de Fidus. La autenticación vive en /api/auth (Better Auth); ' +
          'su propia referencia OpenAPI está en /api/auth/reference.',
      )
      .setVersion('0.1.0')
      .addCookieAuth('better-auth.session_token')
      .build();

    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(env.API_PORT, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`✅ API en http://localhost:${String(env.API_PORT)} (docs: /api/docs)`);
}

void bootstrap();
