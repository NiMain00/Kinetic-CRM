import { Router } from 'express';
const router = Router();

router.all('*', (_req, res) => {
  res.status(501).json({ message: 'Not Implemented: Config endpoints coming soon' });
});

export default router;
