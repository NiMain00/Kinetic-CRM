import { Request, Response, NextFunction } from 'express';

export function scopeMiddleware(resource: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Scope filtering logic per resource
    next();
  };
}
