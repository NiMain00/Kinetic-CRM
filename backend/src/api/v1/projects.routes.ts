import { Router, Request, Response, NextFunction } from 'express';
import { ProjectService } from '../../services/project.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { createProjectSchema, updateProjectSchema, listProjectsSchema } from '../../validators/project.schema';
import { getPagination } from '../../utils/pagination';
import { success } from '../../utils/response';

const router = Router();
const projectService = new ProjectService();

router.get('/',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = getPagination(req.query as any);
      const parsed = listProjectsSchema.safeParse({ ...req.query, page, perPage });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await projectService.list(parsed.data);
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/:id',
  authMiddleware,
  requirePermission('projects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await projectService.get(req.params.id);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/',
  authMiddleware,
  requirePermission('projects.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await projectService.create({ ...parsed.data, createdBy: req.user!.sub });
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

router.put('/:id',
  authMiddleware,
  requirePermission('projects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateProjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await projectService.update(req.params.id, parsed.data, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.delete('/:id',
  authMiddleware,
  requirePermission('projects.delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await projectService.delete(req.params.id);
      res.json(success({ message: 'Proyek berhasil dihapus.' }));
    } catch (err) { next(err); }
  });

export default router;
