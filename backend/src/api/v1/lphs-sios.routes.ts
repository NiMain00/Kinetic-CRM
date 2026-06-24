import { Router, Request, Response, NextFunction } from 'express';
import { LphsSiosService } from '../../services/lphs-sios.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import {
  createLphsSiosSchema,
  departmentApproveSchema,
  departmentRejectSchema,
  departmentReviseSchema,
} from '../../validators/lphs-sios.schema';
import { success } from '../../utils/response';

const lphsSiosService = new LphsSiosService();

const router = Router();

router.post('/:id/submit',
  authMiddleware,
  requirePermission('projects.lphs.submit'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await lphsSiosService.submit(req.params.id, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/departments/:deptId/approve',
  authMiddleware,
  requirePermission('projects.lphs.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = departmentApproveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await lphsSiosService.departmentApprove(req.params.id, req.params.deptId, req.user!.sub, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/departments/:deptId/reject',
  authMiddleware,
  requirePermission('projects.lphs.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = departmentRejectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await lphsSiosService.departmentReject(req.params.id, req.params.deptId, req.user!.sub, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/pm-approve',
  authMiddleware,
  requirePermission('projects.lphs.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await lphsSiosService.pmApprove(req.params.id, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/departments/:deptId/revise',
  authMiddleware,
  requirePermission('projects.lphs.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = departmentReviseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await lphsSiosService.departmentRevise(req.params.id, req.params.deptId, req.user!.sub, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

const projectLphsRouter = Router({ mergeParams: true });

projectLphsRouter.get('/',
  authMiddleware,
  requirePermission('projects.lphs.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await lphsSiosService.getByProject(req.params.projectId);
      res.json(success(result));
    } catch (err) { next(err); }
  });

projectLphsRouter.post('/',
  authMiddleware,
  requirePermission('projects.lphs.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createLphsSiosSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await lphsSiosService.create(req.params.projectId, parsed.data, req.user!.sub);
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

export { projectLphsRouter };
export default router;
