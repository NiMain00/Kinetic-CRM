import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import serverless from 'serverless-http';
import { AppModule } from '../src/app.module';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from '../src/common/prisma-exception.filter';

const expressApp = express();
let cachedHandler: ReturnType<typeof serverless>;

async function bootstrap() {
  if (!cachedHandler) {
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
    );

    app.setGlobalPrefix('api/v1', { exclude: ['health'] });

    const corsOrigins = (
      process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000'
    )
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
    cachedHandler = serverless(expressApp);
  }
  return cachedHandler;
}

export const handler = async (event: any, context: any) => {
  const h = await bootstrap();
  return h(event, context);
};
