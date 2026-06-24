import { Router, Request, Response, NextFunction } from 'express';
import { ProspectService } from '../../services/prospect.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { createProspectSchema, updateProspectSchema, listProspectsSchema } from '../../validators/prospect.schema';
import { success } from '../../utils/response';

const router = Router();
const prospectService = new ProspectService();

router.get('/',
  authMiddleware,
  requirePermission('prospects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = listProspectsSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await prospectService.list(parsed.data);
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/:id',
  authMiddleware,
  requirePermission('prospects.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await prospectService.get(req.params.id);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/',
  authMiddleware,
  requirePermission('prospects.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createProspectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await prospectService.create({ ...parsed.data, createdBy: req.user!.sub });
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

router.put('/:id',
  authMiddleware,
  requirePermission('prospects.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateProspectSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await prospectService.update(req.params.id, parsed.data, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.delete('/:id',
  authMiddleware,
  requirePermission('prospects.delete'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prospectService.delete(req.params.id);
      res.json(success({ message: 'Prospek berhasil dihapus.' }));
    } catch (err) { next(err); }
  });

export default router;
