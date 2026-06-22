import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.statusCode || 500;
  const code = err.errorCode || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';
  res.status(status).json({ success: false, error: { code, message } });
}
