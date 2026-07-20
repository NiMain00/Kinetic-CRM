import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { Express } from 'express';
import { AppModule } from './app.module';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/prisma-exception.filter';

async function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  const corsOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({
    origin: [...new Set([...corsOrigins, 'http://localhost:3000', 'https://localhost'])],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );

  return app;
}

let cachedApp: Express;

async function handler(req: any, res: any) {
  if (!process.env.JWT_SECRET) {
    res.status(500).json({ error: 'Server configuration error: JWT_SECRET not set' });
    return;
  }
  if (!cachedApp) {
    try {
      const app = await NestFactory.create(AppModule);
      await configureApp(app);
      await app.init();
      cachedApp = app.getHttpAdapter().getInstance() as Express;
    } catch (err) {
      console.error('[handler] Failed to initialize app:', err);
      res.status(503).json({ error: 'Service unavailable: initialization failed' });
      return;
    }
  }
  cachedApp(req, res);
}

export = handler;

if (!process.env.VERCEL) {
  (async () => {
    if (!process.env.JWT_SECRET) {
      console.error('FATAL: JWT_SECRET environment variable is required');
      process.exit(1);
    }
    const app = await NestFactory.create(AppModule);
    await configureApp(app);
    const port = process.env.PORT || process.env.API_PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
  })();
}
