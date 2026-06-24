import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { success } from '../../utils/response';

const router = Router();

router.get('/customers',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const customers = await prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(customers));
    } catch (err) { next(err); }
  });

router.get('/branches',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const branches = await prisma.branch.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(branches));
    } catch (err) { next(err); }
  });

router.get('/project-categories',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await prisma.projectCategory.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(categories));
    } catch (err) { next(err); }
  });

router.get('/project-statuses',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const statuses = await prisma.projectStatusDefinition.findMany({
        select: { id: true, code: true, label: true, color: true, displayOrder: true },
        orderBy: { displayOrder: 'asc' },
      });
      res.json(success(statuses));
    } catch (err) { next(err); }
  });

export default router;
