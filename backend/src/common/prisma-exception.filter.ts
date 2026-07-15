import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Maps Prisma's known request errors to proper HTTP status codes instead of
 * letting them surface as opaque 500s. Covers the common constraint failures
 * (unique, foreign key, record-not-found) seen from the generic master CRUD.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaExceptionFilter');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    switch (exception.code) {
      case 'P2002': {
        // Unique constraint violation
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[] | string) ?? 'field';
        const fields = Array.isArray(target) ? target.join(', ') : target;
        message = `Nilai duplikat pada ${fields} — data sudah ada.`;
        break;
      }
      case 'P2003': {
        // Foreign key constraint failed
        status = HttpStatus.BAD_REQUEST;
        const field = (exception.meta?.field_name as string) ?? 'relasi';
        message = `Referensi tidak valid pada ${field}.`;
        break;
      }
      case 'P2025': {
        // Record not found
        status = HttpStatus.NOT_FOUND;
        message =
          (exception.meta?.cause as string) ?? 'Data tidak ditemukan.';
        break;
      }
      default:
        this.logger.error(
          `Unhandled Prisma error ${exception.code}: ${exception.message}`,
        );
        break;
    }

    response.status(status).json({
      statusCode: status,
      error: message,
      code: exception.code,
    });
  }
}

/**
 * Maps Prisma validation errors (invalid enum value, unknown argument, wrong
 * type) to HTTP 400 instead of an opaque 500. These indicate a bad request
 * payload rather than a server fault.
 */
@Catch(Prisma.PrismaClientValidationError)
export class PrismaValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('PrismaValidationExceptionFilter');

  catch(exception: Prisma.PrismaClientValidationError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    this.logger.warn(`Prisma validation error: ${exception.message}`);

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      error: 'Data yang dikirim tidak valid.',
      code: 'PRISMA_VALIDATION',
    });
  }
}
