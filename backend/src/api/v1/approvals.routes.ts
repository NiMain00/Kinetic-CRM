import { Router, Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../../services/approval.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { getPagination } from '../../utils/pagination';
import { success } from '../../utils/response';

const router = Router();
const approvalService = new ApprovalService();

router.get('/',
  authMiddleware,
  requirePermission('approvals.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = getPagination(req.query as any);
      const result = await approvalService.list({
        status: req.query.status as string | undefined,
        resourceType: req.query.resourceType as string | undefined,
        assignedToUserId: req.user?.sub,
        page,
        perPage,
      });
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/:id',
  authMiddleware,
  requirePermission('approvals.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await approvalService.get(req.params.id);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/decide',
  authMiddleware,
  requirePermission('approvals.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { decision, comment } = req.body;
      if (!decision || !['approved', 'rejected'].includes(decision)) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Decision must be "approved" or "rejected".' } });
      }
      const result = await approvalService.decide(req.params.id, { decision, comment }, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/reassign',
  authMiddleware,
  requirePermission('approvals.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { newAssigneeUserId, reason } = req.body;
      if (!newAssigneeUserId || !reason) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'newAssigneeUserId and reason are required.' } });
      }
      const result = await approvalService.reassign(req.params.id, { newAssigneeUserId, reason }, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

export default router;
