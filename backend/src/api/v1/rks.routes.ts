import { Router, Request, Response, NextFunction } from 'express';
import { RksService } from '../../services/rks.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import {
  createRksSchema,
  updateRksSchema,
  approveRksSchema,
  rejectRksSchema,
  addReviewQuestionSchema,
  answerReviewQuestionSchema,
  addReviewNoteSchema,
} from '../../validators/rks.schema';
import { success } from '../../utils/response';

const rksService = new RksService();

const router = Router();

function handleValidation(res: Response, parsed: { success: boolean; error?: any }) {
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e: any) => e.message).join(', ') },
    });
  }
}

router.patch('/:id',
  authMiddleware,
  requirePermission('projects.rks.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateRksSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.update(req.params.id, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/submit',
  authMiddleware,
  requirePermission('projects.rks.submit'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rksService.submit(req.params.id, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/approve',
  authMiddleware,
  requirePermission('projects.rks.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = approveRksSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.approve(req.params.id, req.user!.sub, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/reject',
  authMiddleware,
  requirePermission('projects.rks.approve'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = rejectRksSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.reject(req.params.id, req.user!.sub, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/review-questions',
  authMiddleware,
  requirePermission('projects.rks.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = addReviewQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.addReviewQuestion(req.params.id, parsed.data, req.user!.sub);
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

router.patch('/review-questions/:questionId',
  authMiddleware,
  requirePermission('projects.rks.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = answerReviewQuestionSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.answerReviewQuestion(req.params.questionId, parsed.data, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/:id/review-notes',
  authMiddleware,
  requirePermission('projects.rks.review'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = addReviewNoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.addReviewNote(req.params.id, parsed.data, req.user!.sub);
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

const projectRksRouter = Router({ mergeParams: true });

projectRksRouter.get('/',
  authMiddleware,
  requirePermission('projects.rks.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await rksService.getByProject(req.params.projectId);
      res.json(success(result));
    } catch (err) { next(err); }
  });

projectRksRouter.post('/',
  authMiddleware,
  requirePermission('projects.rks.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createRksSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await rksService.create(req.params.projectId, parsed.data, req.user!.sub);
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

export { projectRksRouter };
export default router;
