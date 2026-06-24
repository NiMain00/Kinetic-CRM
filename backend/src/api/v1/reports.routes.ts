import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { success } from '../../utils/response';
import { AppError } from '../../utils/errors';

const router = Router();

router.get('/pipeline',
  authMiddleware,
  requirePermission('reports.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stages = await prisma.project.groupBy({
        by: ['statusId'],
        _count: { id: true },
      });

      const statuses = await prisma.projectStatusDefinition.findMany({
        select: { id: true, code: true, label: true, color: true, displayOrder: true },
        orderBy: { displayOrder: 'asc' },
      });

      const pipeline = statuses.map((s) => ({
        status: s,
        count: stages.find((g) => g.statusId === s.id)?._count?.id || 0,
      }));

      res.json(success(pipeline));
    } catch (err) { next(err); }
  });

router.get('/win-loss',
  authMiddleware,
  requirePermission('reports.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const results = await prisma.tenderResult.groupBy({
        by: ['result'],
        _count: { id: true },
      });

      const byLossReason = await prisma.tenderResult.groupBy({
        by: ['lossReasonId', 'result'],
        _count: { id: true },
        where: { result: 'kalah' },
      });

      const lossReasons = await prisma.lossReason.findMany({
        select: { id: true, code: true, label: true },
      });

      res.json(success({
        summary: results,
        byLossReason: byLossReason.map((r) => ({
          reason: lossReasons.find((lr) => lr.id === r.lossReasonId),
          count: r._count.id,
        })),
      }));
    } catch (err) { next(err); }
  });

router.get('/performance',
  authMiddleware,
  requirePermission('reports.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const totalProjects = await prisma.project.count({ where: { deletedAt: null } });
      const wonProjects = await prisma.tenderResult.count({ where: { result: 'menang' } });
      const lostProjects = await prisma.tenderResult.count({ where: { result: 'kalah' } });

      res.json(success({
        totalProjects,
        wonProjects,
        lostProjects,
        winRate: totalProjects > 0 ? ((wonProjects / totalProjects) * 100).toFixed(1) : '0.0',
      }));
    } catch (err) { next(err); }
  });

router.get('/progress-vs-target',
  authMiddleware,
  requirePermission('reports.read'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);

      const targets = await prisma.target.findMany({
        include: { definition: true, period: true, snapshots: true },
        where: {
          isCurrentVersion: true,
        },
      });

      const result = targets.map((t) => {
        const totalActual = t.snapshots
          .filter((s) => s.snapshotDate >= yearStart)
          .reduce((sum, s) => sum + Number(s.actualValue), 0);
        const targetVal = Number(t.targetValue);
        return {
          kpi: t.definition.name,
          targetValue: targetVal,
          actualValue: totalActual,
          progressPct: targetVal > 0 ? Math.round((totalActual / targetVal) * 100) : 0,
        };
      });

      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:reportType/export',
  authMiddleware,
  requirePermission('reports.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportType } = req.params;
      const { format } = req.body;

      if (!['xlsx', 'pdf'].includes(format)) {
        throw new AppError(400, 'INVALID_FORMAT', 'Format harus xlsx atau pdf.');
      }

      res.json(success({
        message: `Ekspor laporan ${reportType} dalam format ${format} akan diproses.`,
        reportType,
        format,
        generatedAt: new Date().toISOString(),
      }));
    } catch (err) { next(err); }
  });

export default router;
