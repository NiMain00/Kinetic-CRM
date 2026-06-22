import { Request, Response, NextFunction } from 'express';

export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, error: { code: 'AUTH_REQUIRED', message: 'Autentikasi diperlukan.' } });
    const has = permissions.some(p => req.user!.permissions.includes(p));
    if (!has) return res.status(403).json({ success: false, error: { code: 'AUTHORIZATION_INSUFFICIENT_PERMISSION', message: 'Izin tidak mencukupi.' } });
    next();
  };
}
