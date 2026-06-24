import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
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

router.get('/competitors',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const competitors = await prisma.competitor.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true, shortCode: true, businessField: true, description: true, status: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(competitors));
    } catch (err) { next(err); }
  });

router.get('/competitors/:id',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const competitor = await prisma.competitor.findUnique({
        where: { id: req.params.id },
      });
      if (!competitor || competitor.deletedAt) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Kompetitor tidak ditemukan.' } });
      }
      res.json(success(competitor));
    } catch (err) { next(err); }
  });

router.get('/document-types',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await prisma.documentTypeDefinition.findMany({
        where: { isActive: true },
        select: { id: true, code: true, label: true, appliesToStage: true },
        orderBy: { label: 'asc' },
      });
      res.json(success(types));
    } catch (err) { next(err); }
  });

router.get('/question-types',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const types = await prisma.questionType.findMany({
        where: { isActive: true },
        select: { id: true, code: true, label: true },
        orderBy: { label: 'asc' },
      });
      res.json(success(types));
    } catch (err) { next(err); }
  });

router.get('/questions',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contextFilter = req.query.context as string | undefined;
      const where: any = { isActive: true };
      if (contextFilter) where.context = contextFilter;

      const questions = await prisma.question.findMany({
        where,
        include: {
          questionType: { select: { id: true, code: true, label: true } },
          options: { orderBy: { displayOrder: 'asc' }, select: { id: true, optionLabel: true, displayOrder: true } },
        },
        orderBy: { displayOrder: 'asc' },
      });
      res.json(success(questions));
    } catch (err) { next(err); }
  });

router.get('/holidays',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const holidays = await prisma.holiday.findMany({
        select: { id: true, date: true, description: true, isRecurringAnnually: true },
        orderBy: { date: 'asc' },
      });
      res.json(success(holidays));
    } catch (err) { next(err); }
  });

router.get('/loss-reasons',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const reasons = await prisma.lossReason.findMany({
        where: { isActive: true },
        select: { id: true, code: true, label: true },
        orderBy: { label: 'asc' },
      });
      res.json(success(reasons));
    } catch (err) { next(err); }
  });

router.get('/periods',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const periods = await prisma.periodDefinition.findMany({
        where: { isClosed: false },
        select: { id: true, name: true, startDate: true, endDate: true },
        orderBy: { startDate: 'asc' },
      });
      res.json(success(periods));
    } catch (err) { next(err); }
  });

router.get('/departments',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const departments = await prisma.department.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(departments));
    } catch (err) { next(err); }
  });

router.get('/divisions',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const divisions = await prisma.division.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true },
        orderBy: { name: 'asc' },
      });
      res.json(success(divisions));
    } catch (err) { next(err); }
  });

router.get('/positions',
  authMiddleware,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const positions = await prisma.position.findMany({
        where: { isActive: true },
        select: { id: true, name: true, approvalLevel: true },
        orderBy: { approvalLevel: 'asc' },
      });
      res.json(success(positions));
    } catch (err) { next(err); }
  });

export default router;
