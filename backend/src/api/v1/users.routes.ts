import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../../services/user.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { createUserSchema, updateUserSchema, listUsersSchema } from '../../validators/user.schema';
import { success } from '../../utils/response';
import { AppError } from '../../utils/errors';
import { ZodError } from 'zod';

const router = Router();
const userService = new UserService();

function handleZod(err: unknown, res: Response) {
  if (err instanceof ZodError) {
    return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: err.errors.map(e => e.message).join(', ') } });
  }
  throw err;
}

router.get('/',
  authMiddleware,
  requirePermission('admin.users.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listUsersSchema.parse(req.query);
      const result = await userService.list(query);
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/:id',
  authMiddleware,
  requirePermission('admin.users.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await userService.get(req.params.id);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/',
  authMiddleware,
  requirePermission('admin.users.create'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await userService.create(parsed.data);
      res.status(201).json(success(result));
    } catch (err) { next(err); }
  });

router.patch('/:id',
  authMiddleware,
  requirePermission('admin.users.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map(e => e.message).join(', ') } });
      }
      const result = await userService.update(req.params.id, parsed.data);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.delete('/:id',
  authMiddleware,
  requirePermission('admin.users.update'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await userService.deactivate(req.params.id);
      res.json(success({ message: 'Pengguna dinonaktifkan.' }));
    } catch (err) { next(err); }
  });

export default router;
