import axios from 'axios';
import { PrismaClient, PaymentMethod, PaymentStatus } from '@prisma/client';
import { mpesaConfig, isMpesaConfigured } from '../config/mpesa.js';
import { eventEmitter } from '../services/eventEmitterService.js';

const prisma = new PrismaClient();

async function getAccessToken() {
  if (!isMpesaConfigured()) return null;
  
  const auth = Buffer.from(`${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`).toString('base64');
  const url = mpesaConfig.environment === 'production'
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandboxapi.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  
  const response = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return response.data.access_token;
}

async function initiateSTKPush(phoneNumber: string, amount: number, transactionId: string) {
  if (!isMpesaConfigured()) {
    return { simulated: true, transactionId };
  }

  const token = await getAccessToken();
  if (!token) return null;

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const password = Buffer.from(`${mpesaConfig.shortcode}${mpesaConfig.passkey}${timestamp}`).toString('base64');
  
  const url = mpesaConfig.environment === 'production'
    ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
    : 'https://sandboxapi.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

  const response = await axios.post(url, {
    BusinessShortCode: mpesaConfig.shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: mpesaConfig.shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: mpesaConfig.callbackUrl,
    AccountReference: transactionId,
    TransactionDesc: 'School fee payment'
  }, { headers: { Authorization: `Bearer ${token}` } });

  return response.data;
}

export const mpesaService = {
  async createCheckoutUrl(studentId: string, amount: number, phoneNumber: string) {
    const transactionId = `MPESA-${Date.now()}`;
    
    const transaction = await prisma.mpesaTransaction.create({
      data: {
        studentId,
        amount,
        phoneNumber,
        status: 'PENDING'
      }
    });

    const result = await initiateSTKPush(phoneNumber, amount, transactionId);
    
    return {
      checkoutRequestId: transaction.id,
      merchantRequestId: transaction.id,
      responseCode: result?.ResponseCode || '0',
      responseDescription: result?.ResponseDescription || 'Success',
      customerMessage: result?.CustomerMessage || 'Please check your phone for the prompt',
      simulated: !isMpesaConfigured()
    };
  },

   async handleCallback(req: any, res: any) {
     try {
       const { Body } = req;
       const { stkCallback } = Body;
       
       if (!stkCallback) {
         return res.status(400).json({ message: 'Invalid callback' });
       }
 
       const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;
       
       const transaction = await prisma.mpesaTransaction.findFirst({
         where: { checkoutRequestID: CheckoutRequestID }
       });
 
       if (!transaction) {
         return res.status(404).json({ message: 'Transaction not found' });
       }
 
       await prisma.mpesaTransaction.update({
         where: { id: transaction.id },
         data: {
           merchantRequestID: MerchantRequestID,
           resultCode: ResultCode,
           resultDesc: ResultDesc,
           status: ResultCode === '0' ? 'COMPLETED' : 'FAILED',
           mpesaReceiptNumber: CallbackMetadata?.Item?.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
         }
       });
 
       if (ResultCode === '0' && transaction.studentId) {
         const amount = CallbackMetadata?.Item?.find((i: any) => i.Name === 'Amount')?.Value;
         
         // Create fee record for the payment
         await prisma.fee.create({
           data: {
             studentId: transaction.studentId,
             amount: Number(amount),
             type: 'MPESA_PAYMENT',
             status: PaymentStatus.COMPLETED,
             term: 1,
             year: new Date().getFullYear(),
             dueDate: new Date()
           }
         });
         
         // Emit event for real-time updates
         eventEmitter.emitEvent('fee:paid', {
           studentId: transaction.studentId,
           amount: Number(amount),
           transactionId: transaction.id,
           timestamp: new Date().toISOString()
         });
       }
 
       return res.status(200).json({ success: true });
     } catch (error) {
       console.error('MPESA callback error:', error);
       return res.status(500).json({ message: 'Callback processing failed' });
     }
   },

  async verifyStatus(checkoutRequestId: string) {
    const transaction = await prisma.mpesaTransaction.findFirst({
      where: { checkoutRequestID: checkoutRequestId }
    });
    
    return {
      status: transaction?.status || 'NOT_FOUND',
      amount: transaction?.amount,
      phoneNumber: transaction?.phoneNumber,
      resultCode: transaction?.resultCode,
      resultDesc: transaction?.resultDesc
    };
  },

  async getTransactions() {
    return prisma.mpesaTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  },

  async getTransaction(id: string) {
    return prisma.mpesaTransaction.findUnique({ where: { id } });
  }
};