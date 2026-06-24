import { Router, Request, Response, NextFunction } from 'express';
import { NotificationService } from '../../services/notification.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/rbac.middleware';
import { getPagination } from '../../utils/pagination';
import { success } from '../../utils/response';

const router = Router();
const notificationService = new NotificationService();

router.get('/',
  authMiddleware,
  requirePermission('notifications.read'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = getPagination(req.query as any);
      const unreadOnly = req.query.unreadOnly === 'true';
      const result = await notificationService.list({
        userId: req.user!.sub,
        page,
        perPage,
        unreadOnly,
      });
      res.json(success(result.data, result.pagination));
    } catch (err) { next(err); }
  });

router.get('/unread-count',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await notificationService.getUnreadCount(req.user!.sub);
      res.json(success({ count }));
    } catch (err) { next(err); }
  });

router.patch('/:id/read',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await notificationService.markRead(req.params.id, req.user!.sub);
      res.json(success(result));
    } catch (err) { next(err); }
  });

router.post('/mark-all-read',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAllRead(req.user!.sub);
      res.json(success({ message: 'Semua notifikasi telah dibaca.' }));
    } catch (err) { next(err); }
  });

export default router;
