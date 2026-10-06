import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import express from 'express';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { auth } from '../src/auth/auth';

export async function taskParityApp() {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = module.createNestApplication<NestExpressApplication>({ bodyParser: false });
    app.use('/api/auth', toNodeHandler(auth));
    app.use(express.json());
    app.setGlobalPrefix('api', { exclude: ['health'] });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const email = `paridad-${Date.now()}@navis.test`,
        password = 'Paridad2026Seguro';
    await request(app.getHttpServer())
        .post('/api/auth/sign-up/email')
        .send({ email, password, name: 'Paridad' })
        .expect(200);
    const db = app.get(DataSource),
        placeholder = db.options.type === 'postgres' ? '$1' : '?';
    await db.query(`UPDATE "user" SET "role" = 'superadmin' WHERE "email" = ${placeholder}`, [
        email,
    ]);
    const login = await request(app.getHttpServer())
        .post('/api/auth/sign-in/email')
        .send({ email, password })
        .expect(200);
    const cookies = login.headers['set-cookie'];
    const cookie = (Array.isArray(cookies) ? cookies : [cookies]).join('; ');
    await request(app.getHttpServer())
        .post('/api/v1/churches')
        .set('Cookie', cookie)
        .send({ name: 'Paridad móvil', city: 'Elda' })
        .expect(201);
    return { app, cookie };
}
