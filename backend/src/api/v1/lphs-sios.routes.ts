import { Router } from 'express';
const router = Router();

router.all('*', (_req, res) => {
  res.status(501).json({ message: 'Not Implemented: LPHS/SIOS endpoints coming soon' });
});

export default router;
