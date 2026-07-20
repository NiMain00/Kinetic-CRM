import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    // Only log mutations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const user = req.user as any;
    const route = req.route?.path || req.url;
    const entityType = this.resolveEntityType(route, req.params);
    const entityId = req.params?.id || req.body?.id || null;
    const summary = this.buildSummary(method, entityType, entityId, route);

    // Log after the handler succeeds
    return next.handle().pipe(
      tap({
        next: () => {
          this.auditService.log({
            actorId: user?.id || 'system',
            actorName: user?.fullName || user?.username || 'System',
            action: `${method} ${route}`,
            entityType: entityType || 'unknown',
            entityId: entityId || undefined,
            summary,
            result: 'success',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
            payloadAfter: method !== 'DELETE' ? JSON.stringify(req.body).substring(0, 4000) : undefined,
          }).catch((err) => console.error('[Audit] Log failed:', err?.message));
        },
        error: (err) => {
          this.auditService.log({
            actorId: user?.id || 'system',
            actorName: user?.fullName || user?.username || 'System',
            action: `${method} ${route}`,
            entityType: entityType || 'unknown',
            entityId: entityId || undefined,
            summary,
            result: 'error',
            errorCode: String(err?.status || err?.message || 'unknown'),
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
          }).catch(() => {});
        },
      }),
    );
  }

  private resolveEntityType(route: string, params: any): string | undefined {
    if (route.includes('/auth/login')) return 'auth';
    if (route.includes('/auth/logout')) return 'auth';
    if (params?.entity) return params.entity;
    // Extract from route pattern like /api/v1/prospects/:id
    const parts = route.split('/').filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === 'api' && parts[i + 1] === 'v1') {
        return parts[i + 2]; // e.g. "prospects", "projects", "master"
      }
    }
    return undefined;
  }

  private buildSummary(method: string, entityType: string | undefined, entityId: string | null, route: string): string {
    const action = method === 'POST' ? 'Membuat' : method === 'PUT' || method === 'PATCH' ? 'Memperbarui' : 'Menghapus';
    const target = entityType || route;
    const id = entityId ? ` (${entityId})` : '';
    return `${action} ${target}${id}`;
  }
}
