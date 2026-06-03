import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    data: {
      twoFactorRequired: true,
      sessionTimeoutMinutes: 15,
      ipAllowlistEnabled: true,
      backupEnabled: true
    }
  });
});

export default router;
