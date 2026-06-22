import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string; role: string; permissions: string[];
  branchId?: string; departmentId?: string;
}

declare global { namespace Express { interface Request { user?: AuthPayload } } }

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_MISSING', message: 'Token tidak ditemukan.' } });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret') as AuthPayload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: { code: 'AUTH_TOKEN_INVALID', message: 'Token tidak valid.' } });
  }
}
