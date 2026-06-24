import { Request, Response, NextFunction } from 'express';

export interface ScopeFilter {
  branchId?: string;
  departmentId?: string;
}

export function scopeMiddleware(resource: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      next();
      return;
    }

    const scope: ScopeFilter = {};
    const isAdmin = user.permissions.includes('admin.all');

    if (!isAdmin) {
      if (user.branchId) {
        scope.branchId = user.branchId;
      }
      if (user.departmentId && resource === 'department') {
        scope.departmentId = user.departmentId;
      }
    }

    (req as any).scopeFilter = scope;
    next();
  };
}
