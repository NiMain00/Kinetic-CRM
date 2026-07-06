import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    actorName?: string;
    action: string;
    entityType?: string;
    entityId?: string;
    entityName?: string;
    summary?: string;
    ipAddress?: string;
    userAgent?: string;
    payloadBefore?: string;
    payloadAfter?: string;
    metadata?: string;
    result?: string;
    errorCode?: string;
  }) {
    return this.prisma.auditLog.create({ data: params as any });
  }
}
