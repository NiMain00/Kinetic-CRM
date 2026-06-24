import { Router, Request, Response, NextFunction } from 'express';
import { DashboardService } from '../../services/dashboard.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { success } from '../../utils/response';

const router = Router();
const dashboardService = new DashboardService();

router.get('/summary',
  authMiddleware,
  requirePermission('dashboard.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.getSummary();
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.get('/approvals-pending',
  authMiddleware,
  requirePermission('approvals.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.getPendingApprovals(req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.get('/approaching-deadline',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.getApproachingDeadline();
      res.json(success(result));
    } catch (err) { next(err); }
  });

export default router;
