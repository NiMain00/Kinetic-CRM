import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/prisma-exception.filter';

let cachedApp: express.Express;

async function bootstrapServerless() {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

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

  await app.init();
  return expressApp;
}

export default async function handler(req: any, res: any) {
  cachedApp ??= await bootstrapServerless();
  cachedApp(req, res);
}

if (!process.env.VERCEL) {
  (async () => {
    const app = await NestFactory.create(AppModule);

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

    const port = process.env.PORT || process.env.API_PORT || 4000;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on http://localhost:${port}`);
  })();
}
