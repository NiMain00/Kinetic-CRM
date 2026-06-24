import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { getPagination } from '../../utils/pagination';
import { success } from '../../utils/response';

const router = Router();

router.get('/',
  authMiddleware,
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = getPagination(req.query as any);
      const where: any = {};

      if (req.query.action) where.action = { contains: req.query.action as string };
      if (req.query.resourceType) where.resourceType = req.query.resourceType;
      if (req.query.actorId) where.actorId = req.query.actorId;

      const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip: (page - 1) * perPage,
          take: perPage,
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, name: true } },
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json(success(items, {
        page,
        perPage,
        totalItems: total,
        totalPages: Math.ceil(total / perPage),
      }));
    } catch (err) { next(err); }
  });

router.get('/:id',
  authMiddleware,
  requirePermission('audit.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await prisma.auditLog.findUnique({
        where: { id: req.params.id },
        include: { actor: { select: { id: true, name: true } } },
      });
      if (!entry) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Audit log tidak ditemukan.' } });
      }
      res.json(success(entry));
    } catch (err) { next(err); }
  });

export default router;
