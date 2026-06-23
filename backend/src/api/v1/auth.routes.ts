import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { loginSchema } from '../../validators/auth.schema';
import { AppError } from '../../utils/errors';

const router = Router();
const authService = new AuthService();

function handleError(res: Response, err: unknown) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.errorCode, message: err.message },
    });
  }
  console.error(err);
  return res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error.' },
  });
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(body.username, body.password, ip, userAgent);

    res.json({
      success: true,
      data: result,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'AUTH_REFRESH_MISSING', 'Refresh token diperlukan.');
    }
    await authService.logout(refreshToken);
    res.json({ success: true, data: { message: 'Logout berhasil.' } });
  } catch (err) {
    handleError(res, err);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const user = await authService.me(userId);
    res.json({ success: true, data: user });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(400, 'AUTH_REFRESH_MISSING', 'Refresh token diperlukan.');
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'];

    const result = await authService.refresh(refreshToken, ip, userAgent);

    res.json({
      success: true,
      data: result,
      meta: { requestId: `req_${Date.now()}`, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    handleError(res, err);
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError(400, 'AUTH_PASSWORD_MISSING', 'Password lama dan baru diperlukan.');
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({ success: true, data: { message: 'Password berhasil diubah. Silakan login kembali.' } });
  } catch (err) {
    handleError(res, err);
  }
});

export default router;
