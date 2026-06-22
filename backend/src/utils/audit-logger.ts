import { prisma } from '../config/database';

export class AuditLogger {
  async log(action: string, resource: string, resourceId: string, payload?: unknown) {
    console.log(`[AUDIT] ${action} on ${resource}#${resourceId}`, payload);
    try {
      await prisma.$executeRaw`INSERT INTO audit_logs (action, entity_type, entity_id, user_id, metadata, created_at) VALUES (${action}, ${resource}, ${resourceId}, ${(payload as any)?.userId || 'system'}, ${JSON.stringify(payload || {})}, NOW())`;
    } catch {
      /* audit log write failure is non-blocking */
    }
  }
}
