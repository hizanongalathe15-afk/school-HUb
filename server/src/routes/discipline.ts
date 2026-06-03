import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    data: [
      { type: 'Merit', count: 1420, trend: 'up' },
      { type: 'Demerit', count: 183, trend: 'down' }
    ]
  });
});

export default router;
