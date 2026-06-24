import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { success } from '../../utils/response';
import { AppError } from '../../utils/errors';

const router = Router();
const projectPemenangRouter = Router({ mergeParams: true });

projectPemenangRouter.get('/tender-result',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prisma.tenderResult.findUnique({
        where: { projectId: req.params.projectId },
        include: {
          lossReason: { select: { id: true, code: true, label: true } },
          decider: { select: { id: true, name: true } },
        },
      });
      res.json(success(result));
    } catch (err) { next(err); }
  });

projectPemenangRouter.put('/tender-result',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { result, finalPrice, lossReasonId, lossReasonNote } = req.body;
      if (!result || !['menang', 'kalah'].includes(result)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'result harus "menang" atau "kalah".' } });
      }

      const existing = await prisma.tenderResult.findUnique({
        where: { projectId: req.params.projectId },
      });

      if (existing) {
        const updated = await prisma.tenderResult.update({
          where: { projectId: req.params.projectId },
          data: {
            result,
            ...(finalPrice !== undefined && { finalPrice }),
            ...(lossReasonId !== undefined && { lossReasonId: lossReasonId || null }),
            ...(lossReasonNote !== undefined && { lossReasonNote: lossReasonNote || null }),
            decidedBy: req.user!.sub,
          },
          include: {
            lossReason: { select: { id: true, code: true, label: true } },
            decider: { select: { id: true, name: true } },
          },
        });
        return res.json(success(updated));
      }

      const created = await prisma.tenderResult.create({
        data: {
          projectId: req.params.projectId,
          result,
          finalPrice: finalPrice || null,
          lossReasonId: lossReasonId || null,
          lossReasonNote: lossReasonNote || null,
          decidedBy: req.user!.sub,
        },
        include: {
          lossReason: { select: { id: true, code: true, label: true } },
          decider: { select: { id: true, name: true } },
        },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

projectPemenangRouter.get('/delivery-target',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const target = await prisma.deliveryTarget.findUnique({
        where: { projectId: req.params.projectId },
      });
      res.json(success(target));
    } catch (err) { next(err); }
  });

projectPemenangRouter.put('/delivery-target',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate, picName, notes } = req.body;

      const existing = await prisma.deliveryTarget.findUnique({
        where: { projectId: req.params.projectId },
      });

      if (existing) {
        const updated = await prisma.deliveryTarget.update({
          where: { projectId: req.params.projectId },
          data: {
            ...(startDate !== undefined && { startDate: new Date(startDate) }),
            ...(endDate !== undefined && { endDate: new Date(endDate) }),
            ...(picName !== undefined && { picName }),
            ...(notes !== undefined && { notes }),
          },
        });
        return res.json(success(updated));
      }

      const created = await prisma.deliveryTarget.create({
        data: {
          projectId: req.params.projectId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          picName,
          notes: notes || null,
        },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

export { projectPemenangRouter };
export default router;
