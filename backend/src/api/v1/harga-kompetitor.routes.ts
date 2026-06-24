import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { success } from '../../utils/response';
import { AppError } from '../../utils/errors';

const router = Router();
const projectHargaRouter = Router({ mergeParams: true });

projectHargaRouter.get('/price-submission',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const submission = await prisma.priceSubmission.findUnique({
        where: { projectId: req.params.projectId },
        include: { submitter: { select: { id: true, name: true } } },
      });
      res.json(success(submission));
    } catch (err) { next(err); }
  });

projectHargaRouter.put('/price-submission',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ourPrice, marginPercentage, note, referenceLink } = req.body;
      const existing = await prisma.priceSubmission.findUnique({
        where: { projectId: req.params.projectId },
      });

      if (existing) {
        const updated = await prisma.priceSubmission.update({
          where: { projectId: req.params.projectId },
          data: {
            ...(ourPrice !== undefined && { ourPrice }),
            ...(marginPercentage !== undefined && { marginPercentage }),
            ...(note !== undefined && { note }),
            ...(referenceLink !== undefined && { referenceLink }),
            submittedBy: req.user!.sub,
          },
        });
        return res.json(success(updated));
      }

      const created = await prisma.priceSubmission.create({
        data: {
          projectId: req.params.projectId,
          ourPrice,
          marginPercentage: marginPercentage || null,
          note: note || null,
          referenceLink: referenceLink || null,
          submittedBy: req.user!.sub,
        },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

projectHargaRouter.get('/competitors',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.projectCompetitor.findMany({
        where: { projectId: req.params.projectId },
        include: { competitor: { select: { id: true, name: true, shortCode: true } } },
      });
      res.json(success(competitors));
    } catch (err) { next(err); }
  });

projectHargaRouter.post('/competitors',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { competitorId, competitorPrice, advantageNote } = req.body;
      if (!competitorId) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'competitorId diperlukan.' } });
      }

      const existing = await prisma.projectCompetitor.findUnique({
        where: { projectId_competitorId: { projectId: req.params.projectId, competitorId } },
      });
      if (existing) {
        return res.status(409).json({ success: false, error: { code: 'DUPLICATE', message: 'Kompetitor sudah terdaftar di proyek ini.' } });
      }

      const created = await prisma.projectCompetitor.create({
        data: {
          projectId: req.params.projectId,
          competitorId,
          competitorPrice: competitorPrice || null,
          advantageNote: advantageNote || null,
        },
        include: { competitor: { select: { id: true, name: true, shortCode: true } } },
      });
      res.status(201).json(success(created));
    } catch (err) { next(err); }
  });

projectHargaRouter.delete('/competitors/:competitorId',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const link = await prisma.projectCompetitor.findUnique({
        where: { projectId_competitorId: { projectId: req.params.projectId, competitorId: req.params.competitorId } },
      });
      if (!link) {
        throw new AppError(404, 'NOT_FOUND', 'Kompetitor tidak ditemukan di proyek ini.');
      }
      await prisma.projectCompetitor.delete({ where: { id: link.id } });
      res.json(success({ message: 'Kompetitor berhasil dihapus dari proyek.' }));
    } catch (err) { next(err); }
  });

export { projectHargaRouter };
export default router;
