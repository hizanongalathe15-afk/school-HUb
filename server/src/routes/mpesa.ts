import { Router } from 'express';
import { mpesaService } from '../services/mpesaService.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.post('/checkout', auth, async (req, res) => {
  try {
    const { studentId, amount, phoneNumber } = req.body;
    const result = await mpesaService.createCheckoutUrl(studentId, amount, phoneNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Unable to initiate MPESA payment' });
  }
});

router.post('/callback', async (req, res) => {
  await mpesaService.handleCallback(req, res);
});

router.get('/verify/:checkoutRequestId', auth, async (req, res) => {
  try {
    const status = await mpesaService.verifyStatus(req.params.checkoutRequestId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Unable to verify payment' });
  }
});

router.get('/transactions', auth, async (_req, res) => {
  try {
    const transactions = await mpesaService.getTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Unable to load transactions' });
  }
});

export default router;