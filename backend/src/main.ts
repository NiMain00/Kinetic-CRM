import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import {
  PrismaExceptionFilter,
  PrismaValidationExceptionFilter,
} from './common/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // `/health` is excluded so the Docker/nginx healthcheck can reach it at
  // the root path rather than under `/api/v1`.
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

  // Map Prisma constraint errors (unique / FK / not-found) to proper HTTP codes
  // instead of leaking opaque 500s.
  app.useGlobalFilters(
    new PrismaExceptionFilter(),
    new PrismaValidationExceptionFilter(),
  );

  const port = process.env.PORT || process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://localhost:${port}`);
}
bootstrap();
