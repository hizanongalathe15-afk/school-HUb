import { Router } from 'express';
import { feeController } from '../controllers/feeController.js';
import { auth } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, feeController.getAll);
router.get('/reports', auth, feeController.reports);
router.get('/student/:studentId', auth, feeController.getByStudent);
router.get('/:studentId', auth, feeController.getByStudent);
router.post('/payment', auth, feeController.makePayment);
router.post('/pay', auth, feeController.makePayment);
router.post('/mpesa/simulate', auth, feeController.simulateMpesa);

// Parent-specific fee endpoints
router.get('/balances', auth, feeController.parentGetFeeBalances);
router.get('/payments', auth, feeController.parentGetPaymentHistory);
router.post('/pay/mpesa', auth, feeController.parentMakeMPESAPayment);
router.post('/pay/card', auth, feeController.parentMakeCardPayment);

export default router;
