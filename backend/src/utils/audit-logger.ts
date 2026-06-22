export class AuditLogger {
  log(action: string, resource: string, resourceId: string, payload?: unknown) {
    console.log(`[AUDIT] ${action} on ${resource}#${resourceId}`, payload);
  }
}
