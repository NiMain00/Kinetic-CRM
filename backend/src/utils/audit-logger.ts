import { prisma } from '../config/database';

export class AuditLogger {
  async log(
    action: string,
    resourceType: string,
    resourceId: string,
    data?: {
      actorId?: string;
      actorRoleSnapshot?: string;
      branchIdSnapshot?: string;
      ipAddress?: string;
      userAgent?: string;
      payloadBefore?: unknown;
      payloadAfter?: unknown;
      metadata?: unknown;
      result?: string;
      errorCode?: string;
    },
  ) {
    console.log(`[AUDIT] ${action} on ${resourceType}#${resourceId}`, data);
    try {
      await prisma.auditLog.create({
        data: {
          action,
          resourceType,
          resourceId,
          actorId: data?.actorId || null,
          actorRoleSnapshot: data?.actorRoleSnapshot || 'system',
          branchIdSnapshot: data?.branchIdSnapshot || null,
          ipAddress: data?.ipAddress || '0.0.0.0',
          userAgent: data?.userAgent || null,
          payloadBefore: data?.payloadBefore ? JSON.parse(JSON.stringify(data.payloadBefore)) : undefined,
          payloadAfter: data?.payloadAfter ? JSON.parse(JSON.stringify(data.payloadAfter)) : undefined,
          metadata: data?.metadata ? JSON.parse(JSON.stringify(data.metadata)) : undefined,
          result: data?.result || 'success',
          errorCode: data?.errorCode || null,
        },
      });
    } catch {
      /* audit log write failure is non-blocking */
    }
  }
}
